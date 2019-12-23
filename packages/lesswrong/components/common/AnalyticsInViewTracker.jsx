import { registerComponent } from 'meteor/vulcan:core';
import React, { useEffect } from 'react';
import { useIsInView, useTracking } from "../../lib/analyticsEvents";

const AnalyticsInViewTracker = ({eventType, eventProps, observerProps, children, skip}) => {
    const { ref, entry } = useIsInView(observerProps)
    const { time, isIntersecting, intersectionRatio } = entry

    const { captureEvent } = useTracking()
    useEffect(() => {
        !skip && !!entry && captureEvent(eventType||"inViewEvent", {
            ...eventProps,
            ...observerProps,
            ...{ time, isIntersecting, intersectionRatio }
        })
    }, [entry])

    return (
        <span ref={ref}>
            { children }
        </span>
    )
}

registerComponent('AnalyticsInViewTracker', AnalyticsInViewTracker)
