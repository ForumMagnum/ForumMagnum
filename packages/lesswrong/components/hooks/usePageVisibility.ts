import { useState, useCallback, useEffect } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { isClient } from '../../lib/executionEnvironment';
import { useEventListener } from './useEventListener';

/**
 * Hook to track page visibility state.
 * Returns whether the page is currently visible and the visibility state.
 */
export function usePageVisibility() {
  const { captureEvent } = useTracking();
  const doc = isClient ? document : null;
  const [pageIsVisible, setPageIsVisible] = useState(!doc?.hidden);
  const [pageVisibilityState, setPageVisibilityState] = useState(doc?.visibilityState);

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !doc?.hidden;
    const visibilityState = doc?.visibilityState;
    setPageIsVisible(isVisible);
    setPageVisibilityState(visibilityState);
    captureEvent("pageVisibilityChange", { isVisible, visibilityState });
  }, [doc, captureEvent]);

  useEffect(() => {
    captureEvent("pageVisibilityChange", { 
      isVisible: pageIsVisible, 
      visibilityState: pageVisibilityState 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // visibilitychange seems to be missing from Typescript's list of window events?
  useEventListener('visibilitychange' as keyof WindowEventMap, handleVisibilityChange);

  return { pageIsVisible, pageVisibilityState };
}
