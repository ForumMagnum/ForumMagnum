import React, { useEffect, useState, useRef, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { isClient } from '../../lib/executionEnvironment';

function useEventListener(eventName, handler){
  // Create a ref that stores handler
  const savedHandler = useRef<any>(null);

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      if (isClient) {

        // eslint-disable-next-line no-console
        if (!window.addEventListener) console.log("Error: eventListener not available");

        // Create event listener that calls handler function stored in ref
        const eventListener = event => savedHandler.current(event);

        // Add event listener
        window.addEventListener(eventName, eventListener);

        // Remove event listener on cleanup
        return () => {
          window.removeEventListener(eventName, eventListener);
        };
      }
    },
    [eventName] // Re-run if eventName or element changes
  );
}


function useBeforeUnloadTracking() {
  const { captureEvent } = useTracking()
  const trackBeforeUnload = useCallback(
    () => captureEvent("beforeUnloadFired"),
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

  useEventListener('visibilitychange', handleVisibilityChange)

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


const AnalyticsPageInitializer = () => {
    useBeforeUnloadTracking()
    const { pageIsVisible } = usePageVisibility()
    const { userIsIdle } = useIdlenessDetection(60)
    const { setTimerIsActive } = useCountUpTimer([10, 30], 60)

    useEffect(() => {
      setTimerIsActive(pageIsVisible && !userIsIdle); //disable timer whenever tab hidden or user inactive
    }, [pageIsVisible, userIsIdle, setTimerIsActive])

  return <span/>
};

const AnalyticsPageInitializerComponent = registerComponent('AnalyticsPageInitializer', AnalyticsPageInitializer)

declare global {
  interface ComponentTypes {
    AnalyticsPageInitializer: typeof AnalyticsPageInitializerComponent
  }
}
