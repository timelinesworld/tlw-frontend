// Offline only: no credentials, network access, or database connections.
// node scripts/prepare-sort-order-backfill.mjs <baseline-order.json> <inventory.json> <output.sql>
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const [baselinePath, inventoryPath, outputPath] = process.argv.slice(2);
if (!baselinePath || !inventoryPath || !outputPath) {
  throw new Error('Usage: node scripts/prepare-sort-order-backfill.mjs <baseline> <inventory> <output.sql>');
}
const target = (existsSync(outputPath) ? realpathSync(outputPath) : resolve(outputPath)).toLowerCase();
if (!outputPath.toLowerCase().endsWith('.sql')
  || [baselinePath, inventoryPath].some(source => realpathSync(source).toLowerCase() === target)) {
  throw new Error('Output must be a separate .sql file; approval inputs are immutable');
}
const approvedHash = 'E72FCF2A2109E19C5686819C1610232395DF610D977F2DB173859F3AD14552EF';
const sha = value => createHash('sha256').update(value).digest('hex').toUpperCase();
const bytes = readFileSync(baselinePath);
if (sha(bytes) !== approvedHash) throw new Error('Approved baseline SHA-256 mismatch');
const baseline = JSON.parse(bytes);
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
const id = value => {
  if (value == null || (typeof value === 'number' && !Number.isSafeInteger(value))) throw new Error('Missing/unsafe ID');
  return String(value);
};
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const eventContent = event => canonical({
  id: id(event.id), timeline_id: id(event.timeline_id), year: event.year,
  title: event.title, description: event.description, side: event.side, details: event.details,
});
if (baseline.timelines.length !== 97 || inventory.timelines.length !== 97 || inventory.events.length !== 3534) throw new Error('Approved inventory counts mismatch');
const sourceEvents = new Map(inventory.events.map(event => [id(event.id), event]));
const sourceTimelines = new Set(inventory.timelines.map(timeline => id(timeline.id)));
if (sourceEvents.size !== 3534 || sourceTimelines.size !== 97) throw new Error('Duplicate inventory IDs');
const seenTimelines = new Set(), seenEvents = new Set();
for (const timeline of baseline.timelines) {
  const parent = id(timeline.timeline_id);
  if (seenTimelines.has(parent) || !sourceTimelines.has(parent)) throw new Error('Baseline timeline mismatch');
  seenTimelines.add(parent);
  if (timeline.classification !== 'STABLE' || !timeline.baseline_eligible || timeline.captures.length !== 6) throw new Error('Unapproved/incomplete timeline capture');
  const rows = timeline.default_event_ids.map(eventId => {
    const key = id(eventId), event = sourceEvents.get(key);
    if (seenEvents.has(key) || !event || id(event.timeline_id) !== parent) throw new Error('Baseline event membership mismatch');
    seenEvents.add(key);
    return eventContent(event);
  }).sort((a, b) => a.id.localeCompare(b.id));
  const contentHash = sha(JSON.stringify(rows));
  for (const capture of timeline.captures) {
    if (capture.error || !capture.membership_matches_inventory || !capture.content_matches_inventory || contentHash !== capture.content_hash.toUpperCase()
      || JSON.stringify(capture.default_event_ids) !== JSON.stringify(timeline.default_event_ids)) throw new Error('Captured content/sequence mismatch');
  }
}
if (seenEvents.size !== 3534) throw new Error('Incomplete baseline membership');
const snapshot = JSON.stringify({
  timelines: baseline.timelines.map(timeline => ({ id: id(timeline.timeline_id), event_ids: timeline.default_event_ids.map(id) })),
  events: inventory.events.map(eventContent),
});
if (snapshot.includes('$tlw_snapshot$')) throw new Error('SQL dollar delimiter collision');
const sql = `-- Generated offline from the approved default visitor sequence. Do not hand-edit.
-- Baseline SHA-256: ${approvedHash}
-- 97 timelines / 3534 events. year, IDs, and timestamps never determine order.
-- Rehearse first; coordinated cutover must exclude stale writers/readers.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
-- One transaction prevents concurrent membership/content changes during validation.
LOCK TABLE public.timelines, public.events IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE public.events ADD COLUMN sort_order bigint;

CREATE TEMP TABLE tlw_snapshot(document jsonb) ON COMMIT DROP;
INSERT INTO tlw_snapshot VALUES ($tlw_snapshot$${snapshot}$tlw_snapshot$::jsonb);
CREATE TEMP TABLE tlw_expected_timelines ON COMMIT DROP AS
SELECT timeline->>'id' AS timeline_id
FROM tlw_snapshot, jsonb_array_elements(document->'timelines') AS source(timeline);
ALTER TABLE tlw_expected_timelines ADD PRIMARY KEY (timeline_id);

CREATE TEMP TABLE tlw_approved_positions ON COMMIT DROP AS
SELECT timeline->>'id' AS timeline_id, event_id, ordinal * 10::bigint AS position
FROM tlw_snapshot,
     jsonb_array_elements(document->'timelines') AS source(timeline),
     jsonb_array_elements_text(timeline->'event_ids') WITH ORDINALITY AS sequence(event_id, ordinal);
ALTER TABLE tlw_approved_positions ADD PRIMARY KEY (event_id);
ALTER TABLE tlw_approved_positions ADD UNIQUE (timeline_id, position);

CREATE TEMP TABLE tlw_expected_events ON COMMIT DROP AS
SELECT event->>'id' AS event_id, event->>'timeline_id' AS timeline_id, event AS content
FROM tlw_snapshot, jsonb_array_elements(document->'events') AS source(event);
ALTER TABLE tlw_expected_events ADD PRIMARY KEY (event_id);
CREATE TEMP TABLE tlw_previous_updated_at ON COMMIT DROP AS
SELECT id, updated_at FROM public.timelines;

DO $validation$
BEGIN
  IF (SELECT count(*) FROM public.timelines) <> 97
     OR (SELECT count(*) FROM public.events) <> 3534
     OR (SELECT count(*) FROM tlw_expected_timelines) <> 97
     OR (SELECT count(*) FROM tlw_approved_positions) <> 3534
     OR (SELECT count(*) FROM tlw_expected_events) <> 3534 THEN
    RAISE EXCEPTION 'Approved snapshot counts do not match; aborting backfill';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.timelines AS live FULL JOIN tlw_expected_timelines AS expected
      ON live.id::text = expected.timeline_id
    WHERE live.id IS NULL OR expected.timeline_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.events AS live FULL JOIN tlw_approved_positions AS expected
      ON live.id::text = expected.event_id AND live.timeline_id::text = expected.timeline_id
    WHERE live.id IS NULL OR expected.event_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Approved timeline/event membership changed; aborting backfill';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.events AS live FULL JOIN tlw_expected_events AS expected
      ON live.id::text = expected.event_id AND live.timeline_id::text = expected.timeline_id
    WHERE live.id IS NULL OR expected.event_id IS NULL OR
      jsonb_build_object('id', live.id::text, 'timeline_id', live.timeline_id::text,
        'year', live.year, 'title', live.title, 'description', live.description,
        'side', live.side, 'details', live.details) IS DISTINCT FROM expected.content
  ) THEN
    RAISE EXCEPTION 'Approved event content changed; aborting backfill';
  END IF;
END;
$validation$;

-- Feature #1's existing trigger ignores position-only updates. Do not disable it.
UPDATE public.events AS event SET sort_order = approved.position
FROM tlw_approved_positions AS approved
WHERE event.id::text = approved.event_id AND event.timeline_id::text = approved.timeline_id;

DO $verification$
BEGIN
  IF EXISTS (SELECT 1 FROM public.events WHERE sort_order IS NULL)
     OR EXISTS (SELECT 1 FROM public.events GROUP BY timeline_id, sort_order HAVING count(*) > 1)
     OR EXISTS (
       SELECT 1 FROM public.events AS event JOIN tlw_approved_positions AS approved
         ON event.id::text = approved.event_id AND event.timeline_id::text = approved.timeline_id
       WHERE event.sort_order IS DISTINCT FROM approved.position
     ) THEN
    RAISE EXCEPTION 'Backfill position verification failed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.timelines AS live JOIN tlw_previous_updated_at AS previous USING (id)
    WHERE live.updated_at IS DISTINCT FROM previous.updated_at
  ) THEN
    RAISE EXCEPTION 'Backfill changed timeline updated_at; rolling back';
  END IF;
END;
$verification$;

ALTER TABLE public.events ALTER COLUMN sort_order SET NOT NULL;
-- Signed values permit Top insertion without renumbering existing events.
-- This constraint also supplies the composite ordering index.
ALTER TABLE public.events ADD CONSTRAINT events_timeline_sort_order_unique
  UNIQUE (timeline_id, sort_order) DEFERRABLE INITIALLY IMMEDIATE;
COMMIT;
`;
writeFileSync(outputPath, sql);
console.log('Generated validated backfill: 97 timelines / 3534 events; baseline unchanged.');
