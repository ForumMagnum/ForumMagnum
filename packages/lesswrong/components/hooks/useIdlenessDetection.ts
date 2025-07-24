import { useState, useRef, useCallback, useEffect } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { useEventListener } from './useEventListener';

/**
 * Hook to detect user idleness based on mouse, keyboard, and scroll activity.
 * Returns true when the user has been idle for the specified timeout.
 * 
 * @param timeoutInSeconds - Number of seconds before considering the user idle (default: 60)
 */
export function useIdlenessDetection(timeoutInSeconds = 60) {
  const { captureEvent } = useTracking();
  const [userIsIdle, setUserIsIdle] = useState(false);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  const inactivityAlert = useCallback(() => {
    captureEvent("idlenessDetection", { state: "inactive" });
    setUserIsIdle(true);
  }, [captureEvent]);

  const reset = useCallback(() => {
    const prevUserIsIdle = userIsIdle;
    setUserIsIdle(false);
    
    if (countdownTimer.current) {
      clearTimeout(countdownTimer.current);
    }
    
    countdownTimer.current = setTimeout(inactivityAlert, timeoutInSeconds * 1000);
    
    if (prevUserIsIdle) {
      captureEvent("idlenessDetection", { state: "active" });
    }
  }, [userIsIdle, captureEvent, inactivityAlert, timeoutInSeconds]);

  useEventListener("mousemove", reset);
  useEventListener("keypress", reset);
  useEventListener("scroll", reset);

  useEffect(() => {
    reset();
    return () => {
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { userIsIdle };
} 