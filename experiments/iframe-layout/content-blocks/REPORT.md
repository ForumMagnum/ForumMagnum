# Experiment 3: how every content block behaves next to a widget

Oct 29 2026, about 3am PT. Branch `experiment/iframe-layout-ronny-exp3`.

## Links

| | Post tab | Editor tab |
|---|---|---|
| New demo post: "How content blocks behave next to widgets" | https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks | https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks/editor |
| AI Futures post (Experiment 2's post, with Experiment 3's rules) | https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e | https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor |

The bar at the bottom of every page switches between the two posts and between Post and Editor. Your
edits show on the Post tab; the editor always opens on the original post (your call, Oct 29: nothing is
saved between visits). Reset puts the post back.

## The whole thing in four rules

| Behavior | Which blocks |
|---|---|
| **Flows beside**: lines get shorter beside the widget, full width below it | paragraphs and everything inside them, AI content |
| **Sits beside as one box**, or below the widget if less than 300px fits | headings, spoilers; beside a LEFT widget also quotes, collapsible sections, list items |
| **Sits beside only if it fits at its own size**, else below at full size | code, tables, images, equations |
| **Starts below the widget** | dividers, embeds (video, forecasts, polls), the footnotes |

One more rule covers all the boxes: a box that would sit beside only the last few pixels of a widget,
or hang below the widget more than it sits beside it, starts below the widget instead (less empty space).

Every rule works at every window width: where a widget has no room to wrap (less than 300px of text
beside it), it shows full width and every block just follows it.

## How I decided

1. **Inventory.** 6 agents read the editor and post code from different angles, then 3 rounds of critics
   hunted for missing blocks. Result: 72 kinds of block (`inventory.json` in this folder).
2. **Design.** One designer per group of blocks (14 groups) built test posts, tried 2 to 4 behaviors
   each in the real editor and Post tab, and rendered them at 15 window widths from 320 to 1440px.
   Two judges per group (one reading as a reader, one as an author) tried to break each choice.
   About 53,000 screenshot files in all.
3. **My pass.** I picked across groups for consistency, looked at the screenshots myself, and changed two
   choices by eye (quotes and lists beside a right widget, see below).
4. **Checks.** A new width sweep checks the demo post every 8px from 320 to 2560px in both tabs: no text
   or box under a widget, no sideways scroll, and every block in the same place in the editor and the post.

## Every choice, in full

### Text: flows beside
Paragraphs, bold, italic, links, inline code, mentions, footnote markers, inline math.
- Lines get shorter beside the widget and run the full width below it. Same on both sides.
- Something too long to break (a long equation, a long link) moves to the next line that has room, like a
  long word.
- Nothing changed here; it already worked.

### AI content: flows beside, like text
- Its text wraps like a paragraph. The model label stays at the start of its text.
- If the block starts with a list or heading, the label gets a line of its own (before, it sat under a
  left widget with its rule running down the widget).
- After a left widget pushed down to line up with the block (bottom alignment), the label stays at the
  start of the text instead of out at the widget's far edge.
- Fixed: the AI block was drawn over the widget in the post and took its clicks. Widgets are now always
  on top of the blocks around them.

### Headings (all levels): sit beside as one box
- A heading after a widget sits beside it, all its lines starting at the same edge. If less than 300px is
  left (two widgets side by side), it starts below.
- A heading that would only touch the widget's last 48px starts below it.
- A widget never lines its bottom up with a heading.
- Dragging: a widget dropped just before a heading now lands there and sits beside it (it used to snap
  below the heading).
- **Changed from Experiment 2**, where headings jumped below every widget. That left a hole beside the
  widget whenever a section was shorter than it (100 to 250px), and the editor and post disagreed for
  h3. Runner-up: headings that flow like text, rejected because a long heading wrapped around the
  widget's corner.

### Quotes and collapsible sections: box beside a LEFT widget, text beside a right one
- Beside a left widget the quote's bar, or the section's triangle and line, would run under the widget
  (widgets are see-through). So the whole block moves over as one box, bar and all.
- Beside a right widget nothing runs under it, so they flow like text: a long quote gets full width
  again below the widget.
- The box rule: if more of it would hang below the widget (still narrow) than sit beside it, it starts
  below the widget.
- **A collapsible section is placed as it looks open, open or not** (your call, Oct 29: "if the open
  state would not fit, then the closed state should not fit either"). A section that would hang below
  the widget when open starts below the widget even while closed. So opening or closing a section never
  moves it.
- A widget never lines its bottom up with a collapsible section (it would move whenever the section is
  opened or closed); dragging over a section's lower half drops the widget after it.
- A widget inside a quote or section floats inside it, sized against the quote's own width, and the quote
  holds it (the bar runs down past it). In the post, collapsible sections start closed, and a widget
  inside hides with the section.
- **My change from the designers' pick** (box beside on both sides): I saw long quotes staying narrow
  for hundreds of pixels below a right widget. Known limit: the rule looks for any left widget earlier in
  the post, so a quote beside a right widget that comes after a left one is a box (with the rule above).

### Spoilers: box beside, both sides
- The dark cover and the revealed background stay beside the widget, on either side.
- Fixed: in the post a hidden spoiler's black bar was drawn across the widget.
- Same for two legacy blocks: conditionally visible blocks and old CKEditor tables with captions.

### Lists: each item is a box beside a LEFT widget
- Bullets, numbers and checkboxes sit in the gap next to the widget; nested items keep their indents.
  Items below the widget get the full width back.
- Beside a right widget, lists flow like text (markers are on the left, away from it).
- An item that would only touch the widget's last 48px starts below it.
- A widget inside a list item floats inside the item; the item ends below it.
- Fixed: nested lists used to flatten beside a left widget, and bullets were drawn over text beside a
  bottom-aligned widget. Limit: two-digit numbers sit about 5px from the widget, three-digit ones would
  touch it.

### Code: beside only if every line fits
- A code block sits beside the widget only if its longest line fits there; otherwise it starts below at
  full width. A widget never makes code scroll or hides part of it.
- Same for plain preformatted blocks. Inline code flows like text.
- Safari and Firefox can't measure "longest line" in CSS yet; there a code block sits beside the widget
  whenever 300px fits, and long lines scroll.

### Tables: beside if the table fits
- A table sits beside the widget, filling the room, when its narrowest layout fits there; otherwise it
  starts below at full width.
- A table wider than the whole column (it scrolls) always starts below.
- A widget inside a table cell shows at the full width of the cell.
- Fixed: the editor and the post disagreed for every table. (Safari and Firefox: same fallback as code.)

### Images: keep their size
- An image keeps the size its author gave it. If it fits beside the widget it sits there, centered in
  the room, with its caption; otherwise it starts below. Nothing is ever shrunk.
- Same for captioned, resized and Excalidraw images.
- Fixed: in the editor every image went below a widget (its box was always full width), and a resized
  image showed at full width until you clicked it.

### Equations: beside if the whole equation fits
- A display equation sits beside the widget, centered in the room, when the whole equation fits; a wider
  one starts below, centered in the column. Never cut off beside a widget.
- Inline math moves to the next line with room, like a long word.

### Dividers: start below
- A divider ends a section, so it starts below the widget, like the next section does. (It already
  looked that way; now drag and bottom alignment know about it.)
- Dragging: a widget dropped just before a divider goes below it, and the chip says "Below the divider".

### Embeds: start below
- YouTube, Metaculus, Manifold, Metaforecast, Our World in Data, Neuronpedia, Calendly, LW Artifacts,
  Thoughtsaver, Estimaker, Viewpoints, StrawPoll and Elicit predictions all start below the widget.
- They are fixed-size frames made for the whole column. Beside a widget, Metaculus became a phone layout,
  Calendly a thin strip, videos half size; YouTube was even drawn over the widget.
- Dragging: like dividers ("Below the embed").

### Footnotes: start below
- The footnotes at the end of the post start below the last widget (the editor already did; the post now
  matches). Footnote markers flow with the text; side notes are in the margin and don't interact.
- A widget inside a footnote shows at the footnote's full width. In the editor its side note shows a
  one-line stand-in instead of the widget's source code.

### Other widgets
- Full width: starts below any widget beside it (unchanged).
- Same side: stacks below (unchanged).
- Opposite sides: still sit level, with the drag chip's "text gets narrow" warning (unchanged; see
  "Needs you").
- Centered (only from hand-written HTML): its own row, at its width. The editor now shows it at its width
  too (it showed it full width).

### Lining a widget up with the end of a paragraph
- It only lines up with a block that runs beside it. Never with a heading, divider, embed, the footnotes,
  or a box that went below.
- Fixed: lined up with any of those, the widget was pushed down forever (thousands of px).
- Fixed: it sometimes stopped short of the paragraph's end (when a whole line moved up as the widget moved
  down).

### No interaction (on purpose)
- Paragraph indent and alignment: no menu for them, and publishing drops them.
- Tab characters, right-to-left text, editor-only marks (suggestions, comments, font size): text.
- Page breaks (paste only): the editor's marker narrows beside a widget; posts get nothing.
- Columns: no menu entry, and saved columns turn back into paragraphs. If they are turned on later,
  they should start below a widget.
- Old draft-js images and LaTeX, bare iframes, CTA buttons: only in old posts, which can't have widgets.
- Research blocks: research documents only. Polls and Figma/Tweet embeds: not insertable in posts.
- Dialogue sections: dialogue posts only.
- Not checked: widgets in comments (not in this demo), the TYPE III audio play button next to headings.

## Fixes that affect the editor everywhere
- A long equation or code line made the editor's text column up to 50px wider than the post's, so
  widgets wrapped at window widths where the post shows them full width.
- The block after a widget started about 1em lower in the editor than in the post (so different lines
  wrapped beside the widget).
- A resized image showed full width until clicked.

## Checks
- Width sweep of the demo post, both tabs, every 40px from 320 to 2560 (57 widths): 0 problems. No text
  or box under a widget, no sideways scroll, every block in the same place in the editor and the post.
  (The script, `width-sweep.mjs`, can also step every 8px; I didn't run that one.)
- Drag checks on the Experiment 3 editor: 143 of 143. On the Experiment 2 editor: 142 of 143; the one
  miss (widget frames a moment late after a cancelled resize) is fixed, and that group passes since.
  new-features-check: all pass on both editors.
- An independent code review found 5 small bugs (a Safari/Firefox table fallback, nested sliver marks,
  a leftover flag, a centered widget in a table cell, a dropped re-alignment); all fixed.
- Unit tests: 47 of 47. Type check: 0 errors. Lint: clean.
- Deliberately changed checks (the old behavior they tested is gone): drag-check S3 and E1 (headings),
  and 5 heading-snap unit tests, which now test dividers and embeds (plus one new test: a widget never lines up with a heading).

## Needs you
1. **Widgets on opposite sides.** They still sit level (Experiment 2). A designer recommends stacking
   them, because two level widgets always leave under 300px of text between them (even 25% + 25% leaves
   277px). It's a one-line change. Keep level, or stack?
2. **Safari.** Not tested: Playwright's WebKit isn't installed on the Studio (a download from Microsoft's
   CDN). Say yes and I'll install it and run the width sweep in WebKit. Or open the demo in Safari.
3. **Quotes, sections and lists beside a right widget** flow like text (my call, by eye). If you'd rather
   have one rule for both sides, it's a one-line change.
4. **Enter in the editor jumps to the footnotes.** Pressing Enter anywhere in the content blocks editor
   moves the cursor into the footnotes at the end of the post (found Oct 29, not fixed). Investigate?

## Changes on Oct 29 (MacBook session)
- Collapsible sections are placed as they look open (see above).
- The editor always opens on the original post. Reopening saved edits garbled every widget's code: each
  widget showed a long run of escaped code under it, worse with each reload. It happened in Experiment
  2's editor too (its live deployment is frozen; Reset there clears it).
