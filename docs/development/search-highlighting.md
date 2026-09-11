# Search highlighting — 2026-09-10

Unified search queried `.exact` subfields while requesting highlights from the base fields. The field names and analyzers differed: for example, the base analyzer stems “alignment” while the exact analyzer retains it. Highlight requests now use the searched subfields. The service already translates `.exact` results back to their public field names.

Search results now render full highlighted titles, tag names, display names, and author names where supplied. Missing highlight values retain the original label. Compact sequences use `plaintextDescription` for snippets. Advanced highlighting includes every positive phrase and term and omits filters and exclusions.

Validation: 74 tests across seven search suites; `yarn generate`, `yarn tsc`, targeted ESLint, and `git diff --check` passed. Chrome confirmed highlighted titles and snippets for `alignment` and both phrases in `"inner alignment" "outer alignment"`. Live development search requests returned highlights across posts, comments, tags, sequences, and users.

## Follow-up outside this change

Chrome reported a hydration mismatch on `/search`: server and client generated different IDs for the search sidebar and filter controls (`SearchPage` / `SearchFilterRow`, including `aria-controls`). This also occurred before the final highlighting changes. Investigate the server/client React tree and ID generation separately. Existing concurrent filter UI edits were preserved.

Generation also emitted duplicate GraphQL fragment warnings, and lint reported outdated Browserslist data. Neither check failed.
