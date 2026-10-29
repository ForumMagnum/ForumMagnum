// EXPERIMENT (experiment/iframe-layout-ronny-exp2): a left/right widget with align=bottom lines its bottom
// up with the bottom of the paragraph after it. A float can only start where it is in the text, so it is
// pushed down by a top margin, and shape-outside keeps the text out of only the widget itself (the text
// still runs through the margin above it). The paragraph's height depends on where the widget sits (its
// lines wrap around it), so this measures a few times until the two agree. Used by the post page
// (HydratedIframeWidget) and the editor (IframeWidgetPlugin's preview spacer).

/** The block a widget lines up with: the next one with any height (the editor keeps empty ones for the caret). */
export function alignedParagraph(after: Element): HTMLElement | null {
  let el = after.nextElementSibling;
  while (el instanceof HTMLElement && el.getBoundingClientRect().height < 1) el = el.nextElementSibling;
  return el instanceof HTMLElement ? el : null;
}

/**
 * Pushes `float` (an element floated left or right, whose own top margin is `baseMarginTop`) down until
 * its bottom lines up with `paragraph`'s, but never above where it starts. Returns the push (px).
 */
export function alignFloatBottom(float: HTMLElement, paragraph: HTMLElement | null, baseMarginTop: number): number {
  if (getComputedStyle(float).float === 'none') {
    // Not floated here (a phone, or no room to wrap): it sits between paragraphs as usual.
    clearFloatBottom(float);
    return 0;
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
  const lastPush = Number(float.dataset.lwBottomPush) || 0;
  apply(0);
  const startTop = paragraph.getBoundingClientRect().top;
  if (/^H[1-6]$/.test(paragraph.tagName) || getComputedStyle(paragraph).clear !== 'none'
    || contentTop(paragraph) >= float.getBoundingClientRect().bottom - 1) {
    return 0;
  }
  // Start from the last push, which is usually still right.
  let push = lastPush;
  // push -> how far the paragraph's bottom is below the widget's
  const tried = new Map<number, number>();
  for (let i = 0; i < 6; i++) {
    apply(push);
    // A block that moves with the widget is below it after all (a box that no longer fits beside it).
    if (Math.abs(paragraph.getBoundingClientRect().top - startTop) > 1) {
      apply(0);
      return 0;
    }
    const gap = paragraph.getBoundingClientRect().bottom - float.getBoundingClientRect().bottom;
    tried.set(push, gap);
    const next = Math.max(0, Math.round(push + gap));
    if (tried.has(next)) break;
    push = next;
  }
  // Lines come in whole steps, so the two can go back and forth: take the largest push that keeps the
  // widget's bottom within the paragraph (none when the paragraph is shorter than the widget).
  let best = 0;
  for (const [tryPush, gap] of tried) {
    if (gap >= -1 && tryPush > best) best = tryPush;
  }
  apply(best);
  return best;
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

/** Undoes alignFloatBottom (the widget went back to the top of its paragraph, or to full width). */
export function clearFloatBottom(float: HTMLElement): void {
  float.style.marginTop = '';
  float.style.shapeOutside = '';
  delete float.dataset.lwBottomPush;
  float.removeAttribute('data-lw-pushed');
}
