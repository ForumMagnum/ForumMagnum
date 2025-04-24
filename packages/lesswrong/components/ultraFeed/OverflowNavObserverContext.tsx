import React, { useEffect, useState, useRef, createContext, useContext, ReactNode } from 'react';

const OVERFLOW_HEIGHT_RATIO = 2;
const OVERFLOW_SCROLL_OVERSHOOT = 100;

export interface PairState {
  topIntersect: boolean;
  bottomIntersect: boolean;
  topViewportPos: number;
  bottomViewportPos: number;
  update: () => void;
}

interface SentinelInfo {
  pair: PairState;
  kind: 'top' | 'bottom';
}

interface OverflowNavObserverContextValue {
  observer: IntersectionObserver | null;
  elementMap: WeakMap<Element, SentinelInfo>;
}

const OverflowNavObserverContext = createContext<OverflowNavObserverContextValue | null>(null);

export const OverflowNavObserverProvider = ({ children }: { children: ReactNode }) => {
  const elementMapRef = useRef(new WeakMap<Element, SentinelInfo>());
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                const info = elementMapRef.current.get(entry.target);
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
      };

      const obs = new IntersectionObserver(handleIntersection, { threshold: 0 });
      setObserver(obs);
    }

    return () => {
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const value = React.useMemo(
    () => ({
      observer,
      elementMap: elementMapRef.current,
    }),
    [observer],
  );

  return (
    <OverflowNavObserverContext.Provider value={value}>
      {children}
    </OverflowNavObserverContext.Provider>
  );
};

export interface OverflowNavResult {
  showUp: boolean;
  showDown: boolean;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

/**
 * Hook that determines whether to show "scroll up" and "scroll down" navigation
 * indicators for a target element based on its size and scroll position within
 * the viewport. Uses a shared IntersectionObserver provided via context.
 */
export const useOverflowNav = (
  targetRef: React.RefObject<HTMLElement>,
  ratio: number = OVERFLOW_HEIGHT_RATIO,
): OverflowNavResult => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const context = useContext(OverflowNavObserverContext);
  if (!context) {
    throw new Error('useOverflowNav must be used within an OverflowNavObserverProvider');
  }
  const { observer: sharedObserver, elementMap: sharedMap } = context;

  const pairStateRef = useRef<PairState>({
      topIntersect: false,
      bottomIntersect: false,
      topViewportPos: 0,
      bottomViewportPos: 0,
      update: () => {
        const target = targetRef.current;
        if (!target) return;
        const currentPairState = pairStateRef.current;
        const rect = target.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const isVisible = rect.bottom > 0 && rect.top < viewportH;
        const isOversized = target.offsetHeight >= viewportH * ratio;

        const localShowUp = isOversized && currentPairState.bottomIntersect && !currentPairState.topIntersect && isVisible;
        const localShowBoth = isOversized && !currentPairState.topIntersect && !currentPairState.bottomIntersect && isVisible;
        
        setShowUp(prev => {
          const nextShowUp = localShowUp || localShowBoth;
          return prev !== nextShowUp ? nextShowUp : prev;
        });
        setShowDown(prev => {
           const nextShowDown = localShowBoth;
           return prev !== nextShowDown ? nextShowDown : prev;
        });
      },
  });

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !sharedObserver) return;

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

    const stablePairStateForMap = pairStateRef.current;
    sharedMap.set(topSentinel, { pair: stablePairStateForMap, kind: 'top' });
    sharedMap.set(bottomSentinel, { pair: stablePairStateForMap, kind: 'bottom' });

    sharedObserver.observe(topSentinel);
    sharedObserver.observe(bottomSentinel);

    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        pairStateRef.current.update();
      });
      resizeObserver.observe(target);
    }

    return () => {
      sharedObserver.unobserve(topSentinel);
      sharedObserver.unobserve(bottomSentinel);
      sharedMap.delete(topSentinel);
      sharedMap.delete(bottomSentinel);
      if (topSentinel.parentNode) topSentinel.remove();
      if (bottomSentinel.parentNode) bottomSentinel.remove();
      resizeObserver?.disconnect();
    };
  }, [targetRef, ratio, sharedObserver, sharedMap]);

  const scrollToTop = () => {
    if (topRef.current) {
      const y = topRef.current.getBoundingClientRect().top + window.pageYOffset - OVERFLOW_SCROLL_OVERSHOOT;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  const scrollToBottom = () => {
    if (bottomRef.current) {
      const y = bottomRef.current.getBoundingClientRect().bottom + window.pageYOffset + OVERFLOW_SCROLL_OVERSHOOT - window.innerHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return { showUp, showDown, scrollToTop, scrollToBottom };
};
