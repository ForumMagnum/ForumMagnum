import React, { useEffect, useState, useRef, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { flushClientEvents, useTracking } from "../../lib/analyticsEvents";
import { useEventListener } from '../hooks/useEventListener';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useIdlenessDetection } from '../hooks/useIdlenessDetection';
import { usePageVisibility } from '../hooks/usePageVisibility';

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


function useCountUpTimer (incrementsInSeconds=[10, 30], switchIncrement=60) {
    const { captureEvent } = useTracking()
    const [seconds, setSeconds] = useState(0)
    const [timerIsActive, setTimerIsActive] = useState(true)
    const [smallIncrementInSeconds, largeIncrementInSeconds] = incrementsInSeconds
    const intervalTimer = useRef<any>(null)


    function reset() {
        setSeconds(0)
        setTimerIsActive(false)
    }

    useEffect(() => {
      if (timerIsActive) {
        const  increment = (seconds < switchIncrement ) ? smallIncrementInSeconds : largeIncrementInSeconds
        intervalTimer.current = setInterval(() => {
          setSeconds(seconds + increment)
          captureEvent("timerEvent", {seconds: seconds + increment, increment: increment})
        }, increment*1000) //setInterval uses milliseconds
      } else if (!timerIsActive && seconds !== 0) {
        clearInterval(intervalTimer.current)
      }
      return () => clearInterval(intervalTimer.current)
    }, [timerIsActive, setTimerIsActive, seconds, captureEvent, smallIncrementInSeconds, largeIncrementInSeconds, switchIncrement])

    return { seconds, isActive: timerIsActive, setTimerIsActive, reset }
}


const AnalyticsPageInitializer = () => {
    useBeforeUnloadTracking()
    const { pageIsVisible } = usePageVisibility()
    const { userIsIdle } = useIdlenessDetection(60)
    const { setTimerIsActive } = useCountUpTimer([10, 30], 60)
    const { updateLastActivity } = useSessionManagement()

    const userIsIdleRef = useRef(userIsIdle);
    const pageIsVisibleRef = useRef(pageIsVisible);

    useEffect(() => {
      userIsIdleRef.current = userIsIdle;
      pageIsVisibleRef.current = pageIsVisible;
    }, [userIsIdle, pageIsVisible]);

    useEffect(() => {
      setTimerIsActive(pageIsVisible && !userIsIdle); //disable timer whenever tab hidden or user inactive
    }, [pageIsVisible, userIsIdle, setTimerIsActive])

    useEffect(() => {
      if (!userIsIdle && pageIsVisible) {
        updateLastActivity();
      }
    }, [userIsIdle, pageIsVisible, updateLastActivity])

    useEffect(() => {
      const interval = setInterval(() => {
        if (!userIsIdleRef.current && pageIsVisibleRef.current) {
          updateLastActivity();
        }
      }, 120 * 1000);

      return () => clearInterval(interval);
    }, [updateLastActivity])

  return <></>
};

export default registerComponent('AnalyticsPageInitializer', AnalyticsPageInitializer);


