# Search author pills validation

2026-09-11: Selected authors appear after the text input inside the shared search field. Both locations use the existing authorIds filter state. Removing a pill returns focus to the input and preserves the query. Pills wrap within the field on narrow screens.

Validation:
- Red/green regression covers selection, removal from either location, preservation of another author and the query, remount restoration, and clearing filters.
- SearchPage modal and SearchModal suites: 21 tests pass.
- Targeted ESLint and git diff --check pass.
- Direct Chromium against localhost:3000 verified a real author selection, Backspace removal, synchronized filter removal, and unchanged query.
- Field clientWidth equals scrollWidth at viewport widths 1440, 390, and 320. Screenshot inspected at 320px: /tmp/search-author-pills.png.
- The first browser check timed out on a generated CSS class selector; rerunning with the searchbox element passed.
- Corrected two existing test assertions that still expected the old Authors label instead of Author.
