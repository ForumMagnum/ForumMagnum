import { useCallback, useState } from 'react';

// "Show first N, click to reveal the rest" pattern.
// Keeps the visible slice and a one-shot showAll() in sync with items.length.
export function useGradualReveal<T>(items: T[], initialVisible: number) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const showAll = useCallback(() => setVisibleCount(items.length), [items.length]);
  return {
    visibleItems: items.slice(0, visibleCount),
    visibleCount,
    totalCount: items.length,
    hasMore: items.length > visibleCount,
    showAll,
  };
}
