export const FEED_TOP_SCROLL_OFFSET = 96;

/**
 * Calculate the scroll target position for a feed element,
 * accounting for the fixed header offset
 */
export function getFeedScrollTargetTop(element: HTMLElement | null): number {
  if (element) {
    const rect = element.getBoundingClientRect();
    return Math.max(0, rect.top + window.pageYOffset - FEED_TOP_SCROLL_OFFSET);
  }
  return 0;

}
