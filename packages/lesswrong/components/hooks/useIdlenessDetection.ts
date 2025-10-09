import { useRef, useCallback, useEffect } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { useEventListener } from './useEventListener';

/**
 * Hook to detect user idleness based on mouse, keyboard, and scroll activity.
 * Returns true when the user has been idle for the specified timeout.
 * 
 * @param timeoutInSeconds - Number of seconds before considering the user idle (default: 60)
 */
export function useIdlenessDetection(timeoutInSeconds: number, onChange: (isIdle: boolean) => void) {
  const { captureEvent } = useTracking();
  const isIdleRef = useRef(false);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  const inactivityAlert = useCallback(() => {
    captureEvent("idlenessDetection", { state: "inactive" });
    if (!isIdleRef.current) {
      isIdleRef.current = true;
      onChange(true);
    }
  }, [captureEvent, onChange]);

  const reset = useCallback(() => {
    const prevUserIsIdle = isIdleRef.current;
    if (isIdleRef.current) {
      onChange(false);
      isIdleRef.current = false;
    }
    
    if (countdownTimer.current) {
      clearTimeout(countdownTimer.current);
    }
    
    countdownTimer.current = setTimeout(inactivityAlert, timeoutInSeconds * 1000);
    
    if (prevUserIsIdle) {
      captureEvent("idlenessDetection", { state: "active" });
    }
  }, [captureEvent, inactivityAlert, timeoutInSeconds, onChange]);

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
}
