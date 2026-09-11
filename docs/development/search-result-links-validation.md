# Search result link validation

2026-09-11: Added full-row native links and copy-link controls for the five main search result kinds. Focused Jest suites passed (17 tests), and targeted ESLint passed. Chrome confirmed links cover row padding, body, and kind icons; the copy control darkens on hover and copies the absolute URL without navigation.

Existing issues observed outside this change:
- `yarn tsc` fails because `.next/types/routes` is missing, with related errors in `lib/routeChecks`.
- The local search page reports Next.js dynamic metadata and filter ID hydration errors.
- Development rendering retained the old SearchPage stylesheet through reloads. Renaming the style definition to SearchPageResults refreshed the stylesheet and allowed full-row hit testing to pass.

The sandbox prevented Jest from loading Next.js's TypeScript configuration. The same focused suites passed outside the sandbox.
