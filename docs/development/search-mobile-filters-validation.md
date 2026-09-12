# Mobile search filter layout

2026-09-11: On small screens, the filter toggle sits below the content selection bar in both full-page and modal search. It spans the available width, shows its label, and points down when closed and up when open. Filters and timeframe open beneath it in the existing shared scroll flow. The modal no longer reserves a left gutter for the desktop tab.

Validation:
- Red/green regression tests cover mobile placement with a provided portal slot, opening, and closing for both presentations.
- SearchPage and SearchModal suites: 35 tests pass. The sandbox prevented TypeScript config loading; running with approved escalation succeeded.
- Targeted ESLint and git diff --check pass.
- Direct Chromium: full-page search at 390px and modal search at 390px and 320px put the toggle below the selection bar and filters beneath the toggle, with no horizontal overflow. Mouse and keyboard activation work on mobile.
- Desktop modal at 1440px retains its side tab and opens filters through keyboard activation.
- Restarted the local Next.js server with its existing command and environment to clear stale generated CSS. Log: /tmp/search-mobile-dev-server.log.
- Screenshot: /tmp/search-mobile-filters.png.

Outside scope: the desktop tab's bounding-box center is covered by the dialog when collapsed, causing Playwright's default center click to time out. Keyboard activation works; the exposed tab edge remains the intended pointer target. Existing /search console warnings remain outside this layout change.
