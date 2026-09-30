<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TimeLinesWorld development guide

TimeLinesWorld is a Next.js App Router frontend using React, TypeScript and Supabase. Client components read and mutate Supabase data directly. Server-side functionality includes metadata, sitemap generation and the trends API. Treat the database contract and existing stored data as production-critical.

## Git and production safety

- `main` is the protected production branch.
- Development work must be performed on `development` or a dedicated feature/fix branch.
- Never push directly to `main`.
- Never merge into `main` without explicit human approval.
- Do not commit or push unless explicitly requested.
- Before starting work, report the current branch and working-tree status. Identify existing changes and preserve work outside the requested scope.

## Scope discipline

- Make the smallest practical change required for the requested task.
- Do not perform unrelated refactoring while implementing a feature or fixing a bug.
- Do not change existing user-visible behaviour unless required by the task.
- If a requested change has significant architectural consequences, explain them before implementing it.

## Supabase and data safety

- Treat the existing Supabase database contract as production-critical.
- Do not rename or remove tables, columns, foreign-key relationships, RPCs or expected JSON structures without explicit approval.
- Preserve compatibility with existing timeline and event data.
- Do not modify RLS/security policies unless explicitly requested.
- Never expose service-role keys, tokens, OAuth secrets, Telegram credentials or other secrets in source code.
- Environment-specific credentials must remain in environment variables.
- Client-side admin checks must never be treated as a security boundary; authorization ultimately depends on backend/database policy.
- Existing queries depend on `timelines_category_id_fkey` and `timelines_secondary_category_id_fkey`. Preserve these relationship contracts.
- Preserve the RPC contracts `increment_views({ timeline_id })` and `upsert_failed_search({ search_query })` unless an explicit change is approved.

## Timeline/event compatibility

- Preserve compatibility with existing `timelines`, `events`, `categories`, `users`, `favourites` and `failed_searches` usage.
- Preserve existing `filters` and event `details` formats unless a migration is explicitly approved.
- Timeline `filters` use objects containing `label`, `key` and `options`. Event `details` use arrays of strings, including filterable entries such as `Division: Heavyweight`.
- Changes to timeline/event formats must consider creation, JSON import, bulk import, editing, filtering, rendering and existing stored data.
- Timeline ordering/date changes require special care because existing dates may be free-form. Do not assume that `events.year` contains a normalized date or numeric year.

## UI and responsive behaviour

- TimeLinesWorld supports both Classic and Single timeline layouts.
- Changes to timeline rendering must be checked against both layouts.
- Preserve mobile and desktop behaviour.
- Treat 768px as the existing mobile breakpoint unless a task explicitly changes the responsive design.
- Do not redesign the site's established appearance unless explicitly requested.

## Authentication and user features

- Preserve Supabase Auth behaviour.
- Changes involving authentication must consider login, registration, favourites, admin authorization and user preferences.
- Preserve `timeline_order` and `timeline_theme` preferences unless explicitly changing them.
- Account for both Supabase Auth sessions and the application's `users` profile/role records when changing authentication-related flows.

## Admin/import safety

- Admin creation, editing, deletion and JSON import operate on production-shaped data and require extra care.
- Avoid changes that can leave partially imported timelines/events.
- Do not silently alter import JSON compatibility.
- Any modification to import logic must consider single import, update import and bulk import.
- Check duplicate detection, validation, failure handling and cleanup across the affected import paths. Do not describe separate writes and compensating cleanup as an atomic database transaction.

## SEO and URLs

- Preserve existing metadata, Open Graph, sitemap and timeline URL behaviour unless the task explicitly changes them.
- URL changes must consider internal links, sitemap generation, search/autocomplete navigation and backward compatibility.
- Consider root metadata, timeline-specific metadata and sitemap generation together when changing SEO-related behaviour.

## Quality checks

- Before declaring a code change complete, run the relevant available checks.
- For normal frontend code changes, run `npm run lint` and `npm run build` unless there is a clear reason not to. State that reason in the completion report if a check is skipped.
- Report failures rather than hiding or bypassing them.
- Do not introduce new dependencies unless necessary; explain why before adding one.
- There is currently no automated test suite, so identify important manual regression checks when appropriate.
- Choose manual checks based on the change: both timeline layouts, mobile/desktop, guest/user/admin flows, preferences, favourites, search/filtering and affected import paths.
- For documentation-only changes, verify the content and Git diff; frontend lint/build checks are not required unless the change affects executable configuration or code.

## Known high-risk areas

- Treat `app/timeline/[id]/page.tsx`, `app/admin/page.tsx` and `app/admin/edit/[id]/page.tsx` as high-risk/high-coupling files.
- Changes involving these files should be narrowly scoped and checked for regressions.
- Be especially careful around view counting, event ordering, favourites, duplicate detection, JSON parsing/imports, filters/details and admin mutations.
- Consider duplicated implementations across public timeline editing, the dedicated admin editor, import workflows and shared components before changing a contract or behaviour.

## Completion report

After making changes, clearly report:

1. Files changed.
2. What changed.
3. Checks performed and results.
4. Known risks or limitations.
5. Git branch and working-tree status, distinguishing changes made for the task from pre-existing changes.
