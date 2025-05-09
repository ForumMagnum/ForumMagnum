import React, { useEffect, useState, useRef, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { flushClientEvents, useTracking } from "../../lib/analyticsEvents";
import { isClient } from '../../lib/executionEnvironment';
import { useEventListener } from '../hooks/useEventListener';

function useBeforeUnloadTracking() {
  const { captureEvent } = useTracking()
  const trackBeforeUnload = useCallback(
    () => {
      captureEvent("beforeUnloadFired")
      flushClientEvents()
    },
    [captureEvent]
  );

  useEventListener('beforeunload', trackBeforeUnload)
}


function usePageVisibility() {
  const { captureEvent } = useTracking()
  const doc = isClient ? document : null
  const [pageIsVisible, setPageIsVisible] = useState(!doc?.hidden)
  const [pageVisibilityState, setPageVisibilityState] = useState(doc?.visibilityState)

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !doc?.hidden
    const visibilityState = doc?.visibilityState
    setPageIsVisible(isVisible) //these aren't accessible till re-render or something
    setPageVisibilityState(visibilityState)
    captureEvent("pageVisibilityChange", {isVisible, visibilityState});
  }, [doc, captureEvent]);

  useEffect(() => {
    captureEvent("pageVisibilityChange", {isVisible: pageIsVisible, visibilityState: pageVisibilityState});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // visibilitychange seems to be missing from Typescript's list of window events?
  useEventListener('visibilitychange' as keyof WindowEventMap, handleVisibilityChange)

  return { pageIsVisible, pageVisibilityState }
}


function useIdlenessDetection(timeoutInSeconds=60) {
  const { captureEvent } = useTracking()
  const [userIsIdle, setUserIsIdle] = useState(false)
  const countdownTimer = useRef<any>(null)

  const inactivityAlert = useCallback(() => {
    captureEvent("idlenessDetection", {state: "inactive"})
    setUserIsIdle(true)
  }, [captureEvent, setUserIsIdle])

  const reset = useCallback(()=>{
    const prevUserIsIdle = userIsIdle //so can do this real quick?
    setUserIsIdle(false)
    clearTimeout(countdownTimer.current)
    countdownTimer.current = setTimeout(inactivityAlert, timeoutInSeconds*1000) //setTimeout uses milliseconds
    if (prevUserIsIdle) captureEvent("idlenessDetection", {state: "active"})
  }, [userIsIdle, setUserIsIdle, captureEvent, inactivityAlert, timeoutInSeconds])


  useEventListener("mousemove", reset)
  useEventListener("keypress", reset)
  useEventListener("scroll", reset)

  useEffect(() => {
    reset()
    return () => clearTimeout(countdownTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { userIsIdle }
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


const AnalyticsPageInitializerInner = () => {
    useBeforeUnloadTracking()
    const { pageIsVisible } = usePageVisibility()
    const { userIsIdle } = useIdlenessDetection(60)
    const { setTimerIsActive } = useCountUpTimer([10, 30], 60)

    useEffect(() => {
      setTimerIsActive(pageIsVisible && !userIsIdle); //disable timer whenever tab hidden or user inactive
    }, [pageIsVisible, userIsIdle, setTimerIsActive])

  return <span/>
};

export const AnalyticsPageInitializer = registerComponent('AnalyticsPageInitializer', AnalyticsPageInitializerInner)


