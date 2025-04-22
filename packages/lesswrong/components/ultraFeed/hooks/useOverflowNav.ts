import { useEffect, useState, useRef } from 'react';

export const OVERFLOW_HEIGHT_RATIO = 2;

export interface OverflowNavResult {
  showUp: boolean;
  showDown: boolean;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

/**
 * Hook that determines whether to show "scroll up" and "scroll down" navigation
 * indicators for a target element based on its size and scroll position within
 * the viewport (used in UltraFeed componets).
 *
 * Returns an object containing boolean flags `showUp`, `showDown`, and functions
 * `scrollToTop`, `scrollToBottom` to smoothly scroll near the top or bottom
 * of the target element.
 * 
 * Only returns true if the item is larger than the viewport.
 * Implemented by inserting two sentinel divs 1px-high at the top and bottom of the item,
 * and watching them with an IntersectionObserver to infer state.
 */
export const useOverflowNav = (
  targetRef: React.RefObject<HTMLElement>,
  ratio: number = OVERFLOW_HEIGHT_RATIO,
  _id?: string 
): OverflowNavResult => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  // These will hold sentinel refs for scrolling.
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    interface PairState {
      topIntersect: boolean;
      bottomIntersect: boolean;
      topViewportPos: number; // px from top of viewport when intersecting
      bottomViewportPos: number; // px from top when intersecting
      update: () => void;
    }

    const topSentinel = document.createElement('div');
    const bottomSentinel = document.createElement('div');
    [topSentinel, bottomSentinel].forEach((el) => {
      el.style.width = '100%';
      el.style.height = '1px';
      el.style.pointerEvents = 'none';
    });

    target.prepend(topSentinel);
    target.append(bottomSentinel);

    topRef.current = topSentinel;
    bottomRef.current = bottomSentinel;

    const pairState: PairState = {
      topIntersect: false,
      bottomIntersect: false,
      topViewportPos: 0,
      bottomViewportPos: 0,
      update: () => {
        const rect = target.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const isVisible = rect.bottom > 0 && rect.top < viewportH;
        const isOversized = target.offsetHeight >= viewportH * ratio;

        const showUp = isOversized && pairState.bottomIntersect && !pairState.topIntersect && isVisible;
        const showBoth = isOversized && !pairState.topIntersect && !pairState.bottomIntersect && isVisible;

        setShowUp(showUp || showBoth);
        setShowDown(showBoth);
      },
    };

    const sharedMap: WeakMap<Element, { pair: PairState; kind: 'top' | 'bottom' }> =
      (useOverflowNav as any)._sentinelMap || new WeakMap();
    (useOverflowNav as any)._sentinelMap = sharedMap;

    let sharedObserver: IntersectionObserver = (useOverflowNav as any)._observer;
    if (!sharedObserver) {
      sharedObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const info = sharedMap.get(entry.target);
          if (!info) return;
          if (info.kind === 'top') {
            info.pair.topIntersect = entry.isIntersecting;
            if (entry.isIntersecting) info.pair.topViewportPos = entry.boundingClientRect.top;
          } else {
            info.pair.bottomIntersect = entry.isIntersecting;
            if (entry.isIntersecting) info.pair.bottomViewportPos = entry.boundingClientRect.top;
          }
          info.pair.update();
        });
      }, { threshold: 0 });
      (useOverflowNav as any)._observer = sharedObserver;
    }

    sharedMap.set(topSentinel, { pair: pairState, kind: 'top' });
    sharedMap.set(bottomSentinel, { pair: pairState, kind: 'bottom' });

    sharedObserver.observe(topSentinel);
    sharedObserver.observe(bottomSentinel);

    // Observe size changes on the target to recalc oversize/show flags when it expands
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        pairState.update();
      });
      resizeObserver.observe(target);
    }

    return () => {
      sharedObserver.unobserve(topSentinel);
      sharedObserver.unobserve(bottomSentinel);
      sharedMap.delete(topSentinel);
      sharedMap.delete(bottomSentinel);
      topSentinel.remove();
      bottomSentinel.remove();
      resizeObserver?.disconnect();
    };
  }, [targetRef, ratio]);

  const overshoot = 100;

  const scrollToTop = () => {
    if (topRef.current) {
      const y = topRef.current.getBoundingClientRect().top + window.pageYOffset - overshoot;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      const y = bottomRef.current.getBoundingClientRect().bottom + window.pageYOffset + overshoot - window.innerHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return { showUp, showDown, scrollToTop, scrollToBottom };
};
