import React, { useEffect, useState, useRef } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useTracking } from "../../lib/analyticsEvents";

function useEventListener(eventName, handler, element = window){
  // Create a ref that stores handler
  const savedHandler = useRef();

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      // Make sure element supports addEventListener
      // On
      const isSupported = element && element.addEventListener;
      // eslint-disable-next-line no-console
      if (!isSupported) console.log("Error: eventListener not available");

      // Create event listener that calls handler function stored in ref
      const eventListener = event => savedHandler.current(event);

      // Add event listener
      element.addEventListener(eventName, eventListener);

      // Remove event listener on cleanup
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element] // Re-run if eventName or element changes
  );
}


function useBeforeUnloadTracking() {
  const { captureEvent } = useTracking("beforeUnloadTracking")
  const trackBeforeUnload = () => captureEvent("beforeUnloadFired")

  useEventListener('beforeunload', trackBeforeUnload)
}


function usePageVisibility() {
  const { captureEvent } = useTracking("pageVisibilityTracking")
  const [pageIsVisible, setPageIsVisible] = useState(!document.hidden)
  const [pageVisibilityState, setPageVisibilityState] = useState(document.visibilityState)


function handleVisibilityChange() {
    const isVisible = !document.hidden
    const visibilityState = document.visibilityState
    setPageIsVisible(isVisible) //these aren't accessible till re-render or something
    setPageVisibilityState(visibilityState)
    captureEvent("pageVisibilityChange", {isVisible, visibilityState});
  }

  useEffect(() => {
    captureEvent("pageVisibilityChange", {isVisible: pageIsVisible, visibilityState: pageVisibilityState});
  }, [])

  useEventListener('visibilitychange', handleVisibilityChange)

  return { pageIsVisible, pageVisibilityState }
}


function useIdlenessDetection(timeoutInSeconds=60) {
    const { captureEvent } = useTracking("idlenessDetection")
    const [userIsIdle, setUserIsIdle] = useState(false)
    const countdownTimer = useRef(null)

    useEventListener("mousemove", reset)
    useEventListener("keypress", reset)
    useEventListener("scroll", reset)


    function inactivityAlert() {
        captureEvent("idlenessDetection", {state: "inactive"})
        setUserIsIdle(true)
    }

    function reset() {
      const prevUserIsIdle = userIsIdle //so can do this real quick?
      setUserIsIdle(false)
      clearTimeout(countdownTimer.current)
      countdownTimer.current = setTimeout(inactivityAlert, timeoutInSeconds*1000) //setTimeout uses milliseconds
      if (prevUserIsIdle) captureEvent("idlenessDetection", {state: "active"})
    }

    useEffect(() => {
        reset()
        return () => clearTimeout(countdownTimer.current)
    }, [])

    return { userIsIdle }
}


function useCountUpTimer (incrementsInSeconds=[10, 30], switchIncrement=60) {
    const { captureEvent } = useTracking("timerEvent")
    const [seconds, setSeconds] = useState(0)
    const [timerIsActive, setTimerIsActive] = useState(true)
    const [smallIncrementInSeconds, largeIncrementInSeconds] = incrementsInSeconds
    const intervalTimer = useRef(null)


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
    }, [timerIsActive, setTimerIsActive, seconds])

    return { seconds, isActive: timerIsActive, setTimerIsActive, reset }
}


const AnalyticsPageInitializer = () => {
    useBeforeUnloadTracking()
    const { pageIsVisible } = usePageVisibility()
    const { userIsIdle } = useIdlenessDetection(60)
    const { setTimerIsActive } = useCountUpTimer([10, 30], 60)

    useEffect(() => {
      setTimerIsActive(pageIsVisible && !userIsIdle); //disable timer whenever tab hidden or user inactive
    }, [pageIsVisible, userIsIdle])

  return <span/>
};

registerComponent('AnalyticsPageInitializer', AnalyticsPageInitializer)
