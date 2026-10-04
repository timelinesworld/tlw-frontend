# Feature #3: explicit event order

These migrations have not been executed against production. Do not deploy the
new frontend against the old database. No Before/After or general reorder UI is
included; those belong to Feature #3B.

## Authoritative evidence

`baseline-order.json` is an immutable, separately retained approval artifact:

```text
SHA-256 E72FCF2A2109E19C5686819C1610232395DF610D977F2DB173859F3AD14552EF
97 timelines / 3,534 events / six identical captures per timeline
```

The backfill uses only its default visitor top-to-bottom event-ID arrays. The
embedded inventory content is a drift guard, never an ordering source. Timeline
views/metadata/preferences can change without invalidating event content; event
membership or content drift aborts the migration and requires a new decision.

The offline generator verifies the exact baseline hash and inventory against all
six captured content hashes. To reproduce the migration without database access:

```text
node scripts/prepare-sort-order-backfill.mjs <baseline-order.json> <inventory.json> <output.sql>
```

Keep output separate until reviewed. Compare it byte-for-byte with
`migrations/20261004000100_add_event_sort_order.sql`.

## Minimal database architecture

- `events.sort_order bigint NOT NULL`, signed; no static default.
- Deferrable, initially immediate unique `(timeline_id, sort_order)` constraint
  supplies the ordering index. Deletion leaves gaps.
- `tlw_add_event_block(text, jsonb, text, boolean)` locks the parent row, checks
  admin authorization and existing RLS, validates JSON, optionally rechecks
  update-import duplicates, and inserts one Top/Bottom block in array order.
- `tlw_import_timeline(jsonb)` creates a new timeline and calls the block RPC in
  the same transaction. Bulk imports call it once per file. It resolves both
  categories and serializes same-title imports with a transaction advisory lock.
  This does not impose global title uniqueness on other existing creation paths.
- Both functions are SECURITY INVOKER with an empty search path. Only
  `authenticated` receives EXECUTE; server-side users.role must be `admin`.
  Existing policies/grants are not changed or bypassed.
- Ordinary event edit/delete operations remain direct writes. Editing year does
  not reposition; position changes participate in the existing timestamp trigger.
- No allocator trigger or reorder RPC. Old clients omitting sort_order fail
  NOT NULL. Refresh/close stale admin tabs during cutover.

Allocation is serialized at the database's READ COMMITTED isolation. Confirm
PostgREST transaction isolation and admin visibility before deployment. Unique
constraints fail closed if an external writer bypasses the allocator. Ordinary
edit/delete transactions can contend with parent locks; report conflicts rather
than automatically retrying uncertain inserts. Stronger transaction isolation
can require explicit serialization-failure retries. There is no idempotency token
in Phase 1: after an uncertain network response, inspect results before retrying.

## Placement and JSON contract

- Manual Add, QuickAddEvent and SpeedDial default to Top and offer Bottom.
- New timeline JSON array is the canonical default top-to-bottom sequence:
  first event gets 10, second 20, etc. Dates are display text.
- Update import keeps existing positions and inserts only new events as one
  ordered block at the explicitly selected Top or Bottom. Duplicate matching is
  exact year plus title, treating null and empty title alike. Multiple existing
  matches fail for review; duplicate entries within the new block are skipped.
- Imported sort_order is rejected. Event details remain arrays of strings;
  timeline filters remain the existing array structure. Unknown IDs/timestamps
  are not copied into inserted rows. Invalid JSON never partially imports a file.
- Newest First reads sort_order ASC; Oldest First is its exact reverse. Both
  layouts and filters consume that same sequence. Preferences remain unchanged.

## Production prerequisites and cutover

1. Review a current schema export: native types/nullability, existing triggers,
   users role mapping, category relationships, RPC isolation, and grants/RLS.
   Admins must see all events in a timeline and be allowed to lock/update its
   parent. Guests must still have only intended read access. Do not fix failures
   by introducing SECURITY DEFINER or relaxing RLS without explicit approval.
2. Rehearse both migrations on a disposable production-shaped copy with the
   actual approved data and existing Feature #1 trigger. PostgreSQL execution
   and concurrency tests are required; static checks do not replace them.
3. Prepare backups, function definitions and an ordering-compatible rollback
   frontend. Freeze event writes and coordinate public cutover. The backfill
   rewrites rows, so old unordered readers cannot be assumed stable during it.
4. Apply `20261004000100_add_event_sort_order.sql`, then
   `20261004000200_event_order_operations.sql`. First migration locks both
   tables, checks exact membership/content, backfills, verifies positions and
   unchanged timeline updated_at, and adds constraints in one transaction.
   Lock/statement timeout or any mismatch aborts it completely.
5. Verify all 97 ascending sequences against baseline, all 3,534 events and
   unchanged content/timestamps. Refresh the API schema cache if necessary.
6. Deploy the frontend, close stale admin sessions, perform regression checks,
   then reopen writes. Do not regenerate positions from a fresh query.

## Required staging regression checks

- Both Classic and Single layouts, desktop/mobile at 768px, filters, guest
  default and both saved timeline_order preferences reproduce approved sequences.
- Each manual entry surface adds correctly at Top/Bottom, including empty
  timelines. Two simultaneous additions/blocks get distinct positions and retain
  each block's array order. Empty blocks cause no timestamp change.
- Update-import retries skip duplicates; concurrently submitted updates recheck
  matches under the parent lock. Ambiguous matches produce no writes.
- Single/bulk imports retain secondary category, filters/details and JSON order.
  Invalid event, trigger failure or RLS denial leaves no timeline/event partial
  result for that file. Earlier successful bulk files remain committed.
- Year/content edits preserve position, deletion leaves gaps, view/favourite/
  preference activity preserves updated_at, actual position changes touch it,
  and unchanged position assignments do not.
- Guest and non-admin RPC attempts fail. Unauthorized direct writes remain
  denied by existing RLS. Parent deletion/cascade remains safe.

## Rollback

Each migration transaction rolls back on failure. If the first succeeds but the
second fails, keep writes frozen and repair/retry the second before deployment.
For an application rollback, retain database ordering in the rollback build;
rolling back to the original date sorter does not preserve the approved baseline.

Before any database reversal, freeze writes and preserve current data/order and
function definitions. Revert the timestamp function to its pre-sort_order body
before dropping the ordering column, remove the two new RPCs, then remove the
constraint/column only as an explicitly approved abandonment of explicit order.
Do not overwrite post-cutover additions/reorders with the historical baseline or
restore old updated_at values over legitimate content changes. The baseline
artifact must remain unchanged throughout.
