export const CHAT_PANE_BOTTOM_THRESHOLD_PX = 64;

interface ScrollMetrics {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}

export function isScrolledNearBottom(
  { scrollHeight, scrollTop, clientHeight }: ScrollMetrics,
  thresholdPx = CHAT_PANE_BOTTOM_THRESHOLD_PX,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= thresholdPx;
}

export function countNewVisibleEvents(previousCount: number, nextCount: number): number {
  return nextCount > previousCount ? nextCount - previousCount : 0;
}

export function newMessagePillLabel(count: number): string {
  return `${count} new message${count === 1 ? '' : 's'}`;
}
