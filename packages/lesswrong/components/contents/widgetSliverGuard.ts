// EXPERIMENT (experiment/iframe-layout-ronny-exp3): two helpers for widgets the text wraps around, shared by
// the post (HydratedIframeWidget) and the editor (IframeWidgetPlugin).
//
// The sliver guard. A block that sits beside a widget as one box (a heading, quote, list item, code block,
// table, collapsible section; see widgetNeighbours.ts) keeps the narrower width for its whole height. The
// guard moves a box below the widget instead (data-lw-below, which clears it) when
// - it starts beside only the last few pixels of the widget, or beside its bottom margin: it looks below
//   the widget yet stays narrow (a heading breaks onto two lines for nothing); or
// - more of it would hang below the widget, still narrow, than sit beside it. Going below leaves less
//   empty space (beside the widget) than staying would (under it). List items only get the first check:
//   one long item going below would leave a hole in the middle of its list.
// Text needs no guard: only its lines beside the widget are shortened.

/** A box that starts with less than this much of a widget beside it goes below the widget. */
export const SLIVER_PX = 48;

/**
 * The width a widget inside `column` (the element holding it) is sized and wrapped against: the column's
 * text width. 0 inside a table cell, a footnote or a layout column, where a widget never wraps (it shows
 * at the full width of the cell, footnote or column).
 */
export function widgetContainerWidth(column: HTMLElement): number {
  if (column.closest('td, th, .footnote-content, .footnotes, .footnote-section, .layout-column')) return 0;
  const cs = getComputedStyle(column);
  return column.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
}

/** The floated widgets directly in `root` (the post body or the editor's root), in order. */
function rootFloats(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(
    ':scope > .iframe-widget > iframe.lwFloatedWidget, :scope > .iframe-widget-code[data-lw-wraps]',
  ));
}

/** The block a bottom-aligned widget lines up with (the guard leaves it alone: it is meant to be there). */
function alignedBlock(float: HTMLElement): Element | null {
  if (float.dataset.lwBottomPush === undefined) return null;
  let el = (float.closest('.iframe-widget') ?? float).nextElementSibling;
  while (el && el.getBoundingClientRect().height < 1) el = el.nextElementSibling;
  return el;
}

export function guardSlivers(root: HTMLElement): void {
  for (const el of Array.from(root.querySelectorAll('[data-lw-below]'))) el.removeAttribute('data-lw-below');
  const floats = rootFloats(root);
  if (!floats.length) return;
  const aligned = floats.map(alignedBlock).filter((el): el is Element => !!el);
  const first = floats[0].closest('.iframe-widget') ?? floats[0];
  // Top-level blocks after the first widget, and the items of top-level lists (each is its own box).
  const candidates: HTMLElement[] = [];
  for (let el = first.nextElementSibling; el; el = el.nextElementSibling) {
    if (!(el instanceof HTMLElement) || el.matches('.iframe-widget, .iframe-widget-code, .sentinel-paragraph')) continue;
    if (aligned.some(a => a === el)) continue;
    candidates.push(el);
    if (el.matches('ul, ol')) candidates.push(...Array.from(el.querySelectorAll<HTMLElement>('li')));
  }
  for (const el of candidates) {
    const box = el.getBoundingClientRect();
    if (box.height < 1) continue;
    for (const float of floats) {
      // Only widgets before it in the post.
      if (!(float.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      const widget = float.getBoundingClientRect();
      const marginBottom = parseFloat(getComputedStyle(float).marginBottom) || 0;
      if (box.top >= widget.bottom + marginBottom || box.top < widget.top - 8) continue;
      // A box beside the widget is narrowed to the room next to it; a block whose box runs under the
      // widget (text) isn't a box.
      const side = getComputedStyle(float).float;
      const narrowed = side === 'left' ? box.left >= widget.right - 1 : side === 'right' && box.right <= widget.left + 1;
      if (!narrowed) continue;
      const beside = widget.bottom - box.top;
      const hanging = box.bottom - (widget.bottom + marginBottom);
      if (beside < SLIVER_PX || (el.tagName !== 'LI' && hanging > beside)) {
        el.setAttribute('data-lw-below', '');
        break;
      }
    }
  }
}

const scheduled = new WeakMap<HTMLElement, number>();

/** Runs guardSlivers on `root` in the next frame, once however often it is asked for. */
export function scheduleSliverGuard(root: HTMLElement | null | undefined): void {
  if (!root || scheduled.has(root)) return;
  scheduled.set(root, requestAnimationFrame(() => {
    scheduled.delete(root);
    guardSlivers(root);
  }));
}
