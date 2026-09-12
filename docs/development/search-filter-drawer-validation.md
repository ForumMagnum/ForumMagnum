# Search filter drawer validation

2026-09-11: All six filter sections default to expanded behind one pull tab. Opening the drawer expands every section, including the timeline. Closing preserves selections.

The modal starts at 600px wide and expands leftward up to 1200px, with its right edge fixed 12px from the viewport. The results box stays at the same vertical position; the desktop timeline unfolds above it. The latch protrudes from behind the results box's left edge, points outward when closed, and moves 104px farther left on hover or keyboard focus. Narrow screens keep the drawer within the viewport and place the timeline inside the filters.

Validation:
- Red/green tests cover revealing every section, retaining selections, and rendering the latch outside the clipped search area.
- Search modal, search page modal, and URL suites: 46 tests pass.
- TypeScript, targeted ESLint, and git diff --check pass.
- Direct Chromium at 1440px: results box goes from x=828, width=600 to x=228, width=1200; y=140 and right=1428 remain fixed. Timeline opens above, at y=44.
- Chromium confirms hover, keyboard activation, and mobile opening/closing at 390px without horizontal overflow.

The local Next.js server was restarted with its existing command and environment to clear stale generated CSS. Its output is in /tmp/search-tab-dev-server.log. The existing /search metadata warning is documented in search-filter-reset-validation.md and remains outside this change.
