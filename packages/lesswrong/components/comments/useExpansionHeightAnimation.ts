import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Animates an element's growth when `isCondensed` becomes false, if the
 * returned function was called just before the state change.
 */
export function useExpansionHeightAnimation(elementRef: RefObject<HTMLElement|null>, isCondensed: boolean): () => void {
  const heightBeforeExpansionRef = useRef<number|null>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    const previousHeight = heightBeforeExpansionRef.current;
    heightBeforeExpansionRef.current = null;
    if (!element || previousHeight === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const expandedHeight = element.getBoundingClientRect().height;
    if (expandedHeight <= previousHeight) {
      return;
    }

    // Measure the full content before paint, and release the height once the animation ends.
    const animation = element.animate([
      { height: `${previousHeight}px`, overflow: 'clip' },
      { height: `${expandedHeight}px`, overflow: 'clip' },
    ], { duration: 200, easing: 'ease-out' });

    return () => animation.cancel();
  }, [elementRef, isCondensed]);

  return useCallback(() => {
    heightBeforeExpansionRef.current = elementRef.current?.getBoundingClientRect().height ?? null;
  }, [elementRef]);
}
