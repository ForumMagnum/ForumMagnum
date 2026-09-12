# Search filter reset styling and defaults

2026-09-11: Reset sits directly after each filter summary. Hover background rules have been removed; keyboard focus outlines remain. Events reads “Excluded (default)”. Reset and Clear filters use the same excluded-events default as initial search. A default search shows neither reset control.

Validation:
- Red/green regression: four default/reset/persistence cases failed before the behavior change and passed afterward.
- SearchPage modal and URL suites: 35 tests pass.
- Targeted ESLint and git diff --check pass.
- Direct Chromium confirmed no initial Reset or Clear filters, and excluded events restored after Clear filters and individual Reset.
- Browser hover verification remains limited: the dev server continued serving the prior SearchFilterRow hover CSS after reload, although those rules are absent from source. Recheck after restarting the dev server.
- Jest could not load its TypeScript config in the sandbox; the same command passed outside it.

Unrelated existing issue: Next.js reports runtime data accessed in generateMetadata() on /search, through getForumTypeForPage and getDefaultMetadata. Search remained usable. Metadata and development stylesheet caching are outside this task.
