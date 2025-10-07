import { useCallback, useRef } from 'react';
import { isClient } from '../../lib/executionEnvironment';
import { useEventListener } from './useEventListener';

/**
 * Hook to track page visibility state.
 * When page visibility changes, calls onChange. This does not
 * return a value and does not trigger rerenders; React rerendering is
 * suspended when the tab is not visible, so naively trying to do
 * things with page visibility and React state will fail.
 */
export function usePageVisibility(onChange: (isVisible: boolean, visibilityState: DocumentVisibilityState) => void) {
  const initialVisibility = getPageVisibility();
  const visibilityRef = useRef(initialVisibility.isVisible);

  const handleVisibilityChange = useCallback(() => {
    const { isVisible, visibilityState } = getPageVisibility();
    if (visibilityRef.current !== isVisible) {
      visibilityRef.current = isVisible;
      onChange?.(isVisible, visibilityState);
    }
  }, [onChange]);

  // visibilitychange seems to be missing from Typescript's list of window events?
  useEventListener('visibilitychange' as keyof WindowEventMap, handleVisibilityChange);
}

export function getPageVisibility(): {
  isVisible: boolean,
  visibilityState: DocumentVisibilityState
}{
  if (isClient) {
    return {
      isVisible: !document.hidden,
      visibilityState: document.visibilityState
    };
  } else {
    return { isVisible: false, visibilityState: "hidden" };
  }
}
