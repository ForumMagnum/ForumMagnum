import React, { useEffect, useRef, useCallback } from 'react';
import { flushClientEvents, useTracking } from "../../lib/analyticsEvents";
import { useEventListener } from '../hooks/useEventListener';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useIdlenessDetection } from '../hooks/useIdlenessDetection';
import { getPageVisibility, usePageVisibility } from '../hooks/usePageVisibility';
import { useEffectOnce } from '../hooks/useEffectOnce';

function useBeforeUnloadTracking() {
  const { captureEvent } = useTracking()
  const trackBeforeUnload = useCallback(
    () => {
      captureEvent("beforeUnloadFired")
      flushClientEvents(true)
    },
    [captureEvent]
  );

  useEventListener('beforeunload', trackBeforeUnload)
}


function useCountUpTimer (incrementsInSeconds: number[], switchIncrement: number, timerIsActive: React.RefObject<boolean>) {
  const { captureEvent } = useTracking()
  const secondsRef = useRef(0);
  const [smallIncrementInSeconds, largeIncrementInSeconds] = incrementsInSeconds
  const intervalTimer = useRef<any>(null)
  
  const resetTimer = useCallback(() => {
    if (timerIsActive.current) {
      const increment = (secondsRef.current < switchIncrement)
        ? smallIncrementInSeconds
        : largeIncrementInSeconds
      clearInterval(intervalTimer.current);
      intervalTimer.current = setInterval(() => {
        if (timerIsActive.current) {
          captureEvent("timerEvent", {
            seconds: secondsRef.current + increment,
            increment: increment
          })
        }
        secondsRef.current += increment
      }, increment*1000) //setInterval uses milliseconds
    } else {
      clearInterval(intervalTimer.current)
    }
  }, [captureEvent, largeIncrementInSeconds, smallIncrementInSeconds, switchIncrement, timerIsActive]);
  
  useEffectOnce(resetTimer);
  useEffect(() => {
    return () => clearInterval(intervalTimer.current)
  }, [])
  
  return { resetTimer };
}


const AnalyticsPageInitializer = () => {
  useBeforeUnloadTracking()
  const { captureEvent } = useTracking();

  const pageIsVisibleRef = useRef(true);
  useEffectOnce(() => {
   const { isVisible, visibilityState } = getPageVisibility();
    pageIsVisibleRef.current = isVisible;
    captureEvent("pageVisibilityChange", {isVisible, visibilityState});
  });
  usePageVisibility((isVisible, visibilityState) => {
    pageIsVisibleRef.current = isVisible;
    maybeUpdateLastActivity();
    captureEvent("pageVisibilityChange", {isVisible, visibilityState});
  })

  const timerIsActiveRef = useRef(true);
  const { resetTimer } = useCountUpTimer([10, 30], 60, timerIsActiveRef)
  const { updateLastActivity } = useSessionManagement()

  const userIsIdleRef = useRef(false);
  const maybeUpdateLastActivity = useCallback(() => {
    const active = !userIsIdleRef.current && pageIsVisibleRef.current;
    if (active) {
      updateLastActivity();
    }
    if (timerIsActiveRef.current !== active) {
      timerIsActiveRef.current = active; //disable timer whenever tab hidden or user inactive
      resetTimer();
    }
  }, [updateLastActivity, resetTimer]);

  useIdlenessDetection(60, useCallback((isIdle) => {
    userIsIdleRef.current = isIdle;
    maybeUpdateLastActivity();
  }, [maybeUpdateLastActivity]))
  
  useEffect(() => {
    const interval = setInterval(() => {
      maybeUpdateLastActivity();
    }, 120 * 1000);

    return () => clearInterval(interval);
  }, [maybeUpdateLastActivity])

  return <></>
};

export default AnalyticsPageInitializer;


