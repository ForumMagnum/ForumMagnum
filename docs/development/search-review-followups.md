# Search review follow-ups

Observed while addressing the 15 search review findings on 2026-09-18.

- Legacy `toggle[curated]` bookmarks retain their URL parameter, but the current
  search filter model has no curated-only option and does not apply it. The
  compatibility fixes cover indexed tag/author arrays and named sort values.
  Supporting curated-only bookmarks needs a filter model and UI decision.
- The development `/search` page logs a Next.js runtime-data metadata error from
  `app/layout.tsx` through `getDefaultMetadata` and `getForumTypeForPage`. This
  occurred before the UI fixes; search and the browser checks still worked.

The chapter membership GIN index migration is written but has not been applied.
Its transactional build permits reads and blocks chapter writes during creation.
Sequence refreshes remain immediate; durable batching would require separate
queue work to avoid losing updates when a serverless process stops.

Observed while fixing search typing responsiveness on 2026-09-18:

- Running `yarn tsc --project tsconfig-client.json` directly includes server
  routes under `app/` while redirecting their server imports to client stubs,
  producing missing-module and missing-export errors. The standard `yarn tsc`
  check passes. Review the standalone client configuration separately.
