import { useCallback, useRef } from 'react';

interface MultiClickOptions {
  /** Number of clicks to detect (e.g. 2 for double-click, 3 for triple-click) */
  clickCount?: number;
  /** Time window in milliseconds within which the clicks must occur */
  timeout?: number;
  /** Callback to execute when the desired number of clicks is detected */
  onMultiClick: () => void;
}

/**
 * Hook for detecting multiple clicks (double-click, triple-click, etc.)
 * @param options Configuration options for click detection
 * @returns Click handler to attach to an element
 */
export function useMultiClickHandler({
  clickCount = 3,
  timeout = 300,
  onMultiClick,
}: MultiClickOptions) {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);
  
  return useCallback((e: React.MouseEvent) => {
    clickCountRef.current += 1;
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    if (clickCountRef.current === clickCount) {
      onMultiClick();
    }
    
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
      clickTimerRef.current = null;
    }, timeout);
  }, [clickCount, timeout, onMultiClick]);
}
