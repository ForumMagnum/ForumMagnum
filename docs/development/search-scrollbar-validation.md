# Search modal scrollbar validation

2026-09-11: SearchModal reserves an existing viewport scrollbar gutter while body scrolling is locked and restores the prior inline gutter on close. Pages without a scrollbar keep their original width. Existing stable gutters remain intact.

Validation:
- Added regression coverage before implementation and observed the expected failure. All eight search modal tests now pass. The test mocks computed scrollbar-gutter because the installed jsdom does not support that property.
- Direct Chromium automation against localhost:3000 with classic scrollbars measured body width at 1265 px before, during, and after search. The 15 px scrollbar disappeared while open; its space remained reserved.
- Browser automation with overlay scrollbars measured 1280 px throughout.
- Targeted ESLint and git diff --check passed.

Environment issues:
- Jest configuration loading and local Chromium startup require execution outside the filesystem sandbox.
- An accidentally broad yarn eslint invocation checked the whole project while edits were in progress and reported 93 diagnostics, including malformed JSX attribute names. The subsequent targeted check of both final changed files passed. Whole-project lint is not established as passing.
- The default Playwright browser revision is absent locally; validation used installed system Chromium.
- Existing development-page hydration errors remain recorded in search-result-links-validation.md.
