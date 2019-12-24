import React, { useEffect, useState, useRef } from 'react';
import { useTracking } from "./analyticsEvents";
import { hookToHoc } from "./hocUtils";


const useWindowEvent = (event, callback) => {
    useEffect(() => {
        window.addEventListener(event, callback);
        return () => window.removeEventListener(event, callback);
    }, [event, callback])
};

export const useIdleActivityTimer = (timeout=60000) => {
    const { captureEvent } = useTracking("activityDetection")
    const [userIsActive, setUserIsActive] = useState(true)
    const countdownTimer = useRef(null)

    useWindowEvent("mousemove", reset)
    useWindowEvent("keypress", reset)
    useWindowEvent("scroll", reset)


    function inactivityAlert() {
        captureEvent("activityDetection", {state: "inactive"})
        setUserIsActive(false)
    }

    function reset() {
        if (!userIsActive) {
            captureEvent("activityDetection", {state: "active"})
        }
        setUserIsActive(true)
        clearTimeout(countdownTimer.current)
        countdownTimer.current = setTimeout(inactivityAlert, timeout)
    }

    useEffect(() => {
        reset()
        return () => clearTimeout(countdownTimer.current)
    }, [])

    return { userIsActive }
};

export const withIdleTimer = hookToHoc(useIdleActivityTimer)

export function useCountUpTimer (increments=[10000, 30000], switchIncrement=60000) {
    const { captureEvent } = useTracking("timerEvent")
    const [seconds, setSeconds] = useState(0)
    const [isActive, setIsActive] = useState(true)
    const [smallIncrement, largeIncrement] = increments

    function toggle(state) {
        setIsActive(state)
    }

    function reset() {
        setSeconds(0)
        setIsActive(false)
    }

    useEffect(() => {
        let interval = null;
        let increment = smallIncrement

        if (isActive) {
            if (seconds < switchIncrement ) {increment = smallIncrement}
            else {increment = largeIncrement}
            interval = setInterval(() => {
                setSeconds(seconds => seconds + increment)
                captureEvent("timerEvent", {seconds, increment})
            }, increment)
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [isActive, seconds])

    return { seconds, isActive, toggle, reset }
}

export const withCountUpTimer = hookToHoc(useCountUpTimer)

export function useCountUpTimerActive () {
    const { toggle } = useCountUpTimer([10000, 30000])
    const { userIsActive } = useIdleActivityTimer(60000)

    useEffect(() => {
        toggle(userIsActive)
        }, [userIsActive])
    // return { seconds, isActive, userIsActive, toggle}
}

export const withCountUpTimerActive = hookToHoc(useCountUpTimerActive)

