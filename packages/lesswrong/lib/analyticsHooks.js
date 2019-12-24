import React, { useEffect, useState, useRef } from 'react';
import { useTracking } from "./analyticsEvents";
import { hookToHoc } from "./hocUtils";

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

export function useBeforeUnloadTracking() {
  const { captureEvent } = useTracking()
  const trackBeforeUnload = () => captureEvent("beforeUnloadFired")

  useEventListener('beforeunload', trackBeforeUnload)
}

export function usePageVisibility() {
  const { captureEvent } = useTracking()
  const pageIsVisible = useRef(!document.hidden)

  function handleVisibilityChange() {
    console.log({isVisible: !document.hidden, visibilityState: document.visibilityState});
    captureEvent("pageVisibilityChange", {isVisible: !document.hidden, visibilityState: document.visibilityState});
    useRef.current = !document.hidden
  }

  useEventListener('visibilitychange', handleVisibilityChange)

  return { pageIsVisible, pageVisibilityState: document.visibilityState }
}

export function useIdleActivityTimer(timeoutInSeconds=60) {
    const { captureEvent } = useTracking("activityDetection")
    const [userIsActive, setUserIsActive] = useState(true)
    const countdownTimer = useRef(null)

    useEventListener("mousemove", reset)
    useEventListener("keypress", reset)
    useEventListener("scroll", reset)


    function inactivityAlert() {
        captureEvent("activityDetection", {state: "inactive"})
        console.log({"activityDetection": {state: "inactive"}})

        setUserIsActive(false)
    }

    function reset() {
        if (!userIsActive) {
            captureEvent("activityDetection", {state: "active"})
          console.log({"activityDetection": {state: "active"}})
        }
        setUserIsActive(true)
        clearTimeout(countdownTimer.current)
        countdownTimer.current = setTimeout(inactivityAlert, timeoutInSeconds*1000) //setTimeout uses milliseconds
    }

    useEffect(() => {
        reset()
        return () => clearTimeout(countdownTimer.current)
    }, [])

    return { userIsActive }
};


export function useCountUpTimer (incrementsInSeconds=[10, 30], switchIncrement=60) {
    const { captureEvent } = useTracking("timerEvent")
    const [seconds, setSeconds] = useState(0)
    const [isActive, setIsActive] = useState(true)
    const [smallIncrementInSeconds, largeIncrementInSeconds] = incrementsInSeconds

    function setTimerState(state) {
        setIsActive(state)
    }

    function reset() {
        setSeconds(0)
        setIsActive(false)
    }

    useEffect(() => {
        let interval = null;
        let increment = smallIncrementInSeconds

        if (isActive) {
            if (seconds < switchIncrement ) {increment = smallIncrementInSeconds}
            else {increment = largeIncrementInSeconds}
            interval = setInterval(() => {
                setSeconds(seconds => seconds + increment)
                captureEvent("timerEvent", {seconds, increment: increment})
            }, increment*1000) //setInterval uses milliseconds
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [isActive, seconds])

    return { seconds, isActive, setTimerState, reset }
}

export const withCountUpTimerActive = hookToHoc(useCountUpTimerActive)

export function useCombinedAnalyticsHooks() {
  useBeforeUnloadTracking()
  const { pageIsVisible } = usePageVisibility()
  const { userIsActive } = useIdleActivityTimer(60)
  const { setTimerState } = useCountUpTimer([10, 30], 60)

  useEffect( () => {
    setTimerState(userIsActive && pageIsVisible)
    console.log({combined: {timerActive: userIsActive && pageIsVisible.current, userIsActive, pageIsVisible: pageIsVisible.current,
        pageVisibilityStatus: document.visibilityState}})
  }, [pageIsVisible.current, userIsActive, document.hidden])

}

export const withCombinedAnalyticsHooks = hookToHoc(useCombinedAnalyticsHooks)
