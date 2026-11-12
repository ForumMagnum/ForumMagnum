import { useLayoutEffect, useRef } from 'react';

/** Animate newly loaded rows without animating initial loads or filter changes. */
export const useLoadMoreExpansion = ({ loading, itemCount, enabled = true }: {
  loading: boolean,
  itemCount: number,
  enabled?: boolean,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const heightBeforeLoadMoreRef = useRef<number|null>(null);

  useLayoutEffect(() => {
    if (loading) return;

    const element = listRef.current;
    const previousHeight = heightBeforeLoadMoreRef.current;
    heightBeforeLoadMoreRef.current = null;
    if (!enabled || !element || previousHeight === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const expandedHeight = element.getBoundingClientRect().height;
    if (expandedHeight <= previousHeight) return;

    const animation = element.animate([
      { height: `${previousHeight}px`, overflow: 'clip' },
      { height: `${expandedHeight}px`, overflow: 'clip' },
    ], { duration: 200, easing: 'ease-out' });

    return () => animation.cancel();
  }, [loading, itemCount, enabled]);

  const prepareForLoadMore = () => {
    if (enabled) {
      heightBeforeLoadMoreRef.current = listRef.current?.getBoundingClientRect().height ?? null;
    }
  };

  return { listRef, prepareForLoadMore };
};
