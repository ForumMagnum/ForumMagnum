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
  };
  if (!paragraph) {
    apply(0);
    return 0;
  }
  // Start from the last push, which is usually still right.
  let push = Number(float.dataset.lwBottomPush) || 0;
  // push -> how far the paragraph's bottom is below the widget's
  const tried = new Map<number, number>();
  for (let i = 0; i < 6; i++) {
    apply(push);
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

/** Undoes alignFloatBottom (the widget went back to the top of its paragraph, or to full width). */
export function clearFloatBottom(float: HTMLElement): void {
  float.style.marginTop = '';
  float.style.shapeOutside = '';
  delete float.dataset.lwBottomPush;
}
