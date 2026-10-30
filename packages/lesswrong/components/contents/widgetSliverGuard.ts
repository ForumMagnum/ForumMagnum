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
// A collapsible section is measured as it looks open, open or not (Ronny, Oct 29 2026: "if the open state
// would not fit, then the closed state should not fit either"), so opening or closing it never moves it.
// Text needs no guard: only its lines beside the widget are shortened.
//
// The same pass narrows the editor's caret lines beside a widget (narrowCaretLines), and marks the quotes,
// collapsible sections and lists whose nearest widget above is a left one (markAfterLeftWidget).

/** A box that starts with less than this much of a widget beside it goes below the widget. */
export const SLIVER_PX = 48;

/**
 * The width a widget inside `column` (the element holding it) is sized and wrapped against: the column's
 * text width. 0 inside any other block (a quote, list item, collapsible section, AI content, table cell,
 * footnote or layout column), where a widget never wraps: widgets don't go inside other blocks (Ronny, Oct
 * 29 2026; the editor moves them out), so one there comes from old HTML and shows at the block's width.
 */
export function widgetContainerWidth(column: HTMLElement): number {
  // (The editor's layout column is a div marked data-lexical-layout-item; the post's has .layout-column.)
  if (column.closest('blockquote, li, .detailsBlock, .llm-content-block, td, th, .footnote-content, .footnotes, .footnote-section, .layout-column, [data-lexical-layout-item]')) return 0;
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

/**
 * Fired on the root when the guard moved a block (it changes where everything after it sits), so that
 * whatever was measured before can measure again: the editor's widget frames, bottom alignment.
 */
export const WIDGET_LAYOUT_EVENT = 'lw-widget-layout';

/** The blocks a root's guard may mark: its own children, and the items of its lists (not deeper: a nested
 * container with a widget in it has a guard of its own, and a nested item is held by its parent item). */
const OWN_MARKS = ':scope > [data-lw-below], :scope > :is(ul, ol) > li[data-lw-below]';

export function guardSlivers(root: HTMLElement): void {
  const marked = (selector: string) => Array.from(root.querySelectorAll(selector));
  const before = marked(OWN_MARKS);
  const beforeLeft = marked(`:scope > [${AFTER_LEFT_WIDGET_ATTR}]`);
  for (const el of before) el.removeAttribute('data-lw-below');
  markAfterLeftWidget(root);
  markSlivers(root);
  narrowCaretLines(root);
  const after = marked(OWN_MARKS);
  const afterLeft = marked(`:scope > [${AFTER_LEFT_WIDGET_ATTR}]`);
  const changed = (a: Element[], b: Element[]) => a.length !== b.length || a.some((el, i) => el !== b[i]);
  if (changed(after, before) || changed(afterLeft, beforeLeft)) {
    root.dispatchEvent(new Event(WIDGET_LAYOUT_EVENT));
  }
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): marks the quotes, collapsible sections and lists in
 * `root` whose nearest widget above is a left one: the last widget before them, with nothing between that
 * starts below it (a full-width widget, a divider, an embed). Beside a left widget those are boxes
 * (widgetNeighbours). No two widgets share a height, so that widget is the only one that can be beside
 * them: after a right widget they flow like text, also when a left widget came before it. (The CSS rule
 * this replaces, "after any left widget", made the quote beside a right widget a box too, so a long one
 * stayed narrow below the widget: Ronny, Oct 30 2026.)
 */
export const AFTER_LEFT_WIDGET_ATTR = 'data-lw-after-left';

function markAfterLeftWidget(root: HTMLElement): void {
  let side: string | null = null;
  for (const el of Array.from(root.children)) {
    if (!(el instanceof HTMLElement) || el.matches('.sentinel-paragraph')) continue;
    if (el.matches('.iframe-widget, .iframe-widget-code')) {
      // A widget the text wraps around, or a full-width one (which starts below the ones before it).
      const float = el.matches('[data-lw-wraps]') ? el : el.querySelector<HTMLElement>(':scope > iframe.lwFloatedWidget');
      side = float ? getComputedStyle(float).float : null;
      continue;
    }
    if (side && getComputedStyle(el).clear !== 'none') side = null;
    if (el.matches('blockquote, .detailsBlock, ul, ol')) el.toggleAttribute(AFTER_LEFT_WIDGET_ATTR, side === 'left');
  }
}

/** When the last few WIDGET_LAYOUT_EVENTs on each root fired (their timeStamps). */
const recentEvents = new WeakMap<HTMLElement, number[]>();

/**
 * Whether bottom-aligned widgets in `root` may line up again after `event` (a WIDGET_LAYOUT_EVENT): not
 * after more than 4 such events within a second, so the guard and bottom alignment can't keep setting
 * each other off. Each event counts once, however many widgets ask; a widget turned down gets
 * `realignLater` called a second later. (Measuring the editor's widget frames again is always fine.)
 */
export function mayRealignAfterGuard(root: HTMLElement, event: Event, realignLater: () => void): boolean {
  const times = recentEvents.get(root) ?? [];
  if (!times.includes(event.timeStamp)) {
    times.push(event.timeStamp);
    recentEvents.set(root, times.filter(t => event.timeStamp - t < 1000));
  }
  if (times.filter(t => event.timeStamp - t < 1000 && t <= event.timeStamp).length <= 4) return true;
  // Too often: once things settle, line up once more, so the last change isn't lost.
  if (!trailing.has(realignLater)) {
    trailing.add(realignLater);
    setTimeout(() => {
      trailing.delete(realignLater);
      realignLater();
    }, 1000);
  }
  return false;
}

const trailing = new Set<() => void>();

/**
 * Where `el` (whose box is `box`) ends for the guard: a collapsible section where it would end open,
 * anything else where it ends now. A closed section (the post's <details>, or the editors' div marked
 * closed) is opened for the measurement and closed again before anything is drawn. Nothing listens for
 * sections opening, so that has no other effect.
 */
function openBottom(el: HTMLElement, box: DOMRect): number {
  if (!el.matches('.detailsBlock')) return box.bottom;
  if (el instanceof HTMLDetailsElement) {
    if (el.open) return box.bottom;
    el.open = true;
    const bottom = el.getBoundingClientRect().bottom;
    el.open = false;
    return bottom;
  }
  const closedClass = ['detailsBlockClosed', 'closed'].find(c => el.classList.contains(c));
  if (!closedClass) return box.bottom;
  el.classList.remove(closedClass);
  const bottom = el.getBoundingClientRect().bottom;
  el.classList.add(closedClass);
  return bottom;
}

function markSlivers(root: HTMLElement): void {
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
    if (el.matches('ul, ol')) candidates.push(...Array.from(el.querySelectorAll<HTMLElement>(':scope > li')));
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
      const hanging = openBottom(el, box) - (widget.bottom + marginBottom);
      if (beside < SLIVER_PX || (el.tagName !== 'LI' && hanging > beside)) {
        el.setAttribute('data-lw-below', '');
        break;
      }
    }
  }
}

/** Marks an editor caret paragraph narrowed by narrowCaretLines (so it is widened again once it isn't beside a widget). */
export const CARET_BESIDE_ATTR = 'data-lw-beside';

/**
 * The editor's caret line between two blocks is drawn by a sentinel paragraph, which is out of the flow
 * (so the margins around it collapse as in the post) and spans the column. Beside a wrapped widget it
 * spans only the text beside the widget, like the blocks there: it starts (or ends) at the widget's
 * margin edge. (The post has no sentinels.)
 */
function narrowCaretLines(root: HTMLElement): void {
  const sentinels = Array.from(root.querySelectorAll<HTMLElement>(':scope > .sentinel-paragraph'));
  if (!sentinels.length) return;
  const cs = getComputedStyle(root);
  const rootBox = root.getBoundingClientRect();
  const paddingLeft = rootBox.left + (parseFloat(cs.borderLeftWidth) || 0);
  const paddingRight = rootBox.right - (parseFloat(cs.borderRightWidth) || 0);
  // Each widget's margin box (what text and boxes beside it keep clear of).
  const widgets = rootFloats(root).map(float => {
    const fcs = getComputedStyle(float);
    const box = float.getBoundingClientRect();
    return {
      float, side: fcs.float,
      top: box.top - (parseFloat(fcs.marginTop) || 0), bottom: box.bottom + (parseFloat(fcs.marginBottom) || 0),
      left: box.left - (parseFloat(fcs.marginLeft) || 0), right: box.right + (parseFloat(fcs.marginRight) || 0),
    };
  });
  // (Measure them all, then set them all.)
  const insets = sentinels.map(sentinel => {
    const top = sentinel.getBoundingClientRect().top;
    let left = 0, right = 0;
    for (const w of widgets) {
      if (!(w.float.compareDocumentPosition(sentinel) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      if (top < w.top || top >= w.bottom) continue;
      if (w.side === 'left') left = Math.max(left, w.right - paddingLeft);
      else if (w.side === 'right') right = Math.max(right, paddingRight - w.left);
    }
    return { left, right };
  });
  sentinels.forEach((sentinel, i) => {
    const { left, right } = insets[i];
    sentinel.style.left = left > 0 ? `${Math.round(left)}px` : '';
    sentinel.style.right = right > 0 ? `${Math.round(right)}px` : '';
    sentinel.toggleAttribute(CARET_BESIDE_ATTR, left > 0 || right > 0);
  });
}

const scheduled = new WeakMap<HTMLElement, number>();

/**
 * Runs guardSlivers on `root` in the next frame, once however often it is asked for. Not while a widget is
 * being dragged or resized in the editor (body.lw-widget-dragging): moving blocks then would move the drop
 * targets under the pointer. It runs once the gesture ends.
 */
export function scheduleSliverGuard(root: HTMLElement | null | undefined): void {
  if (!root || scheduled.has(root)) return;
  scheduled.set(root, requestAnimationFrame(() => {
    scheduled.delete(root);
    if (document.body.classList.contains('lw-widget-dragging')) {
      // Checked again every frame, so it runs in the first frame after the gesture.
      scheduleSliverGuard(root);
      return;
    }
    guardSlivers(root);
  }));
}
