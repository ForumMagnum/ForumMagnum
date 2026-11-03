// EXPERIMENT (experiment/iframe-layout-ronny-exp2): a left/right widget with align=bottom lines its bottom
// up with the bottom of the paragraph after it. A float can only start where it is in the text, so it is
// pushed down by a top margin, and shape-outside keeps the text out of only the widget itself (the text
// still runs through the margin above it). The paragraph's height depends on where the widget sits (its
// lines wrap around it), so this measures a few times until the two agree. Used by the post page
// (HydratedIframeWidget) and the editor (IframeWidgetPlugin's preview spacer).
// EXPERIMENT (experiment/iframe-layout-ronny-exp3): with span=N it lines up with the Nth block after it
// instead: a paragraph shorter than the widget, which then starts beside the text before it (Ronny, Nov 2
// 2026). And where the widget shows full width (no room beside it), it goes below that block (trailBelow).
import { WIDGET_CLEAR_CLASS } from '@/components/lexical/embeds/IframeWidgetEmbed/widgetClearClass';

/** EXPERIMENT (experiment/iframe-layout-ronny-exp3): on the blocks a left or right widget is pushed down past (see alignFloatBottom). */
export const SPANNED_ATTR = 'data-lw-spanned';

/** What each bottom-aligned float lines up with, and the blocks it was pushed down past (marked SPANNED_ATTR). */
const lineUps = new WeakMap<HTMLElement, { target: HTMLElement, spanned: HTMLElement[] }>();

/** EXPERIMENT (experiment/iframe-layout-ronny-exp3): a block with nothing in it (a blank line, or one of the editor's empty paragraphs around widgets). */
export function isBlankBlock(el: Element): boolean {
  return !el.matches('hr, img, iframe, figure') && !el.textContent?.trim()
    && !el.querySelector('img, svg, iframe, video, canvas, hr, math, .math-tex');
}

/**
 * The block a widget lines up with: the `span`th one after it with any content (the editor keeps empty ones
 * for the caret, and blank lines don't count). EXPERIMENT (experiment/iframe-layout-ronny-exp3): null at
 * another widget or a "Start below widget", and past a block that starts below widgets (a section heading, or
 * anything that clears them) or a collapsible section (opening or closing it would move the widget). One
 * that doesn't fit beside the widget goes below it, and then alignFloatBottom finds the block below too.
 */
export function alignedBlock(after: Element, span = 1): HTMLElement | null {
  let count = 0;
  for (let el = after.nextElementSibling; el instanceof HTMLElement; el = el.nextElementSibling) {
    if (el.matches(`.iframe-widget, .iframe-widget-code, .${WIDGET_CLEAR_CLASS}`)) return null;
    if (el.getBoundingClientRect().height < 1 || isBlankBlock(el)) continue;
    if (++count >= span) return el;
    if (el.matches('h1, h2, .detailsBlock') || getComputedStyle(el).clear !== 'none') return null;
  }
  return null;
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): blocks whose text wraps beside a widget, as lines or as
 * one box (smaller headings, quotes, lists, spoilers): they sit beside a widget of any width it wraps at, so
 * a widget lined up with a later block's bottom can start beside them. (Code, tables, images and equations
 * keep their own size: beside only where it fits, see the drag's naturalWidth.)
 */
export const WRAPPING_BLOCKS = 'p, .llm-content-block, h3, h4, h5, h6, blockquote, ul, ol, .spoilers, .spoiler-block';

/** The block a bottom-aligned float lines up with (see alignFloatBottom), or null. */
export function lineUpTarget(float: HTMLElement): HTMLElement | null {
  return float.dataset.lwBottomPush === undefined ? null : lineUps.get(float)?.target ?? null;
}

/**
 * Pushes `float` (an element floated left or right, whose own top margin is `baseMarginTop`) down until
 * its bottom lines up with `paragraph`'s, but never above where it starts. Returns the push (px).
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): `span`: `paragraph` is that many blocks after it (see
 * alignedBlock), and the text before it moves as the widget does.
 */
export function alignFloatBottom(float: HTMLElement, paragraph: HTMLElement | null, baseMarginTop: number, span = 1): number {
  if (getComputedStyle(float).float === 'none') {
    // Not floated here (a phone, or no room to wrap): it sits between paragraphs as usual.
    clearFloatBottom(float);
    return 0;
  }
  unmarkSpanned(float);
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the blocks from the float's own down to the one it
  // lines up with (see the marks below).
  const spanned: HTMLElement[] = [];
  if (paragraph) {
    for (let el = (float.closest('.iframe-widget') ?? float).nextElementSibling; el instanceof HTMLElement; el = el.nextElementSibling) {
      spanned.push(el);
      if (el === paragraph) break;
    }
    lineUps.set(float, { target: paragraph, spanned });
  } else {
    lineUps.delete(float);
  }
  const apply = (push: number) => {
    float.style.marginTop = `${baseMarginTop + push}px`;
    float.style.shapeOutside = push > 0 ? `inset(${push}px 0 0 0)` : '';
    float.dataset.lwBottomPush = String(push);
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): for the rules about what sits beside a pushed widget.
    float.toggleAttribute('data-lw-pushed', push > 0);
  };
  if (!paragraph) {
    apply(0);
    return 0;
  }
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): only a block that runs beside the widget can be lined
  // up with. One that starts below it (it clears the widget, or doesn't fit beside it) would only move
  // down with every push, so the widget stays at the top of its place. Headings aren't lined up with
  // either: the drag never offers it, and a widget ending on a heading reads as part of the next section.
  // Nor are collapsible sections: lined up with a section's end, the widget would move whenever a reader
  // opened or closed it (and posts start them closed, editors open).
  const lastPush = Number(float.dataset.lwBottomPush) || 0;
  apply(0);
  const startTop = paragraph.getBoundingClientRect().top;
  if (/^H[1-6]$/.test(paragraph.tagName) || paragraph.matches('.detailsBlock')
    || getComputedStyle(paragraph).clear !== 'none'
    || contentTop(paragraph) >= float.getBoundingClientRect().bottom - 1) {
    return 0;
  }
  // The largest push that keeps the widget's bottom within the paragraph (none when the paragraph is
  // shorter than the widget). Each step moves the widget down by how far it is from the paragraph's
  // bottom; but lines come in whole steps (pushed lower, the widget can let a whole line move up out of
  // the paragraph), so a step can overshoot. EXPERIMENT (experiment/iframe-layout-ronny-exp3): then it
  // halves the range between the largest push known to fit and the smallest known not to, so it always
  // closes in instead of giving up at the first overshoot.
  const settle = (from: number): number => {
    let good = 0;
    let bad = Infinity;
    let push = from;
    for (let i = 0; i < 12; i++) {
      apply(push);
      // A block that moves with the widget is below it after all (a box that no longer fits beside it).
      // EXPERIMENT (experiment/iframe-layout-ronny-exp3): past other blocks, the text before it reflows as
      // the widget moves, so there it only counts once it has gone below the widget.
      const below = span > 1
        ? contentTop(paragraph) >= float.getBoundingClientRect().bottom - 1
        : Math.abs(paragraph.getBoundingClientRect().top - startTop) > 1;
      if (below) {
        apply(0);
        return 0;
      }
      const gap = paragraph.getBoundingClientRect().bottom - float.getBoundingClientRect().bottom;
      if (gap >= -1) {
        good = Math.max(good, push);
        if (gap <= 1) break;
      } else {
        bad = Math.min(bad, push);
      }
      let next = Math.max(0, Math.round(push + gap));
      if (next >= bad || next <= good) {
        next = bad === Infinity ? good + Math.max(1, Math.round(gap)) : Math.floor((good + bad) / 2);
      }
      // Nothing left between the two.
      if (next <= good || next >= bad) break;
      push = next;
    }
    apply(good);
    return good;
  };
  // Start from the last push, which is usually still right.
  let push = settle(lastPush);
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the blocks whose tops it was pushed down past are
  // marked, for AI content's label (see widgetNeighbours: beside a left widget's margin it would sit out
  // at the widget's far edge). That makes them a little taller, which pushes the widget a little further,
  // so it lines up again (twice at most: the marks only add height above the widget).
  const side = float.dataset.lwSide ?? '';
  for (let pass = 0; pass < 2; pass++) {
    const top = float.getBoundingClientRect().top;
    const above = push > 0 ? spanned.filter(el => el.getBoundingClientRect().top < top - 1) : [];
    if (spanned.every(el => el.hasAttribute(SPANNED_ATTR) === above.includes(el))) break;
    for (const el of spanned) {
      if (above.includes(el)) el.setAttribute(SPANNED_ATTR, side);
      else el.removeAttribute(SPANNED_ATTR);
    }
    push = settle(push);
  }
  if (!push) unmarkSpanned(float);
  return push;
}

/**
 * Where a block's content starts: its first line of text or its first image, video, frame or drawing. A
 * block's own box can start beside a widget while its content has moved below it (an image too wide for
 * the room beside the widget starts on the next line that has room).
 */
function contentTop(block: HTMLElement): number {
  let top = Infinity;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rect = range.getClientRects()[0];
    if (rect) {
      top = rect.top;
      break;
    }
  }
  const media = block.querySelector('img, svg, iframe, video, canvas');
  if (media) top = Math.min(top, media.getBoundingClientRect().top);
  return Number.isFinite(top) ? top : block.getBoundingClientRect().top;
}

function unmarkSpanned(float: HTMLElement): void {
  for (const el of lineUps.get(float)?.spanned ?? []) el.removeAttribute(SPANNED_ATTR);
}

/** Undoes alignFloatBottom (the widget went back to the top of its paragraph, or to full width). */
export function clearFloatBottom(float: HTMLElement): void {
  unmarkSpanned(float);
  lineUps.delete(float);
  float.style.marginTop = '';
  float.style.shapeOutside = '';
  delete float.dataset.lwBottomPush;
  float.removeAttribute('data-lw-pushed');
}

/** The blocks each widget block moved up past it on screen (see trailBelow). */
const trails = new WeakMap<HTMLElement, HTMLElement[]>();

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): a bottom-aligned widget that shows full width (no room
 * beside it at this width) goes below the block it lines up with, so that block's text comes first, as it
 * does beside the widget on wider screens (Ronny, Nov 2 2026). `widget` is the widget's own block. On screen
 * only: it and the blocks down to `block` swap places with transforms, so its place in the text stays and
 * nothing after them moves. Run it again whenever those blocks change height; with `block` null it only
 * undoes it.
 */
export function trailBelow(widget: HTMLElement, block: HTMLElement | null): void {
  clearTrail(widget);
  if (!block) return;
  const moved: HTMLElement[] = [];
  for (let el = widget.nextElementSibling; el instanceof HTMLElement; el = el.nextElementSibling) {
    moved.push(el);
    if (el === block) break;
  }
  const first = moved.find(el => el.getBoundingClientRect().height >= 1);
  if (moved[moved.length - 1] !== block || !first) return;
  const self = widget.getBoundingClientRect();
  // The blocks go up to where the widget starts, and the widget down to end where they ended.
  const up = first.getBoundingClientRect().top - self.top;
  const down = block.getBoundingClientRect().bottom - self.bottom;
  if (up <= 0 || down <= 0) return;
  for (const el of moved) el.style.transform = `translateY(${-up}px)`;
  widget.style.transform = `translateY(${down}px)`;
  trails.set(widget, moved);
}

/** Puts back what trailBelow moved. */
export function clearTrail(widget: HTMLElement): void {
  for (const el of trails.get(widget) ?? []) el.style.transform = '';
  trails.delete(widget);
  widget.style.transform = '';
}
