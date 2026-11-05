export function getNextSearchResultIndex(currentIndex: number, resultCount: number, direction: "ArrowUp" | "ArrowDown") {
  if (resultCount === 0) return -1;
  if (currentIndex === -1) return 0;
  return Math.max(0, Math.min(resultCount - 1, currentIndex + (direction === 'ArrowDown' ? 1 : -1)));
}
