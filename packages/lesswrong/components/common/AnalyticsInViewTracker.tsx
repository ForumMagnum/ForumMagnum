import React, { useCallback } from 'react';
import { useSubscribeIsInView, useTracking } from "../../lib/analyticsEvents";
import { useStabilizedCallback } from '../hooks/useDebouncedCallback';

const AnalyticsInViewTracker = ({eventType, eventProps, observerProps, children, skip}: {
  eventType?: string,
  eventProps?: Record<string,any>,
  observerProps?: Record<string,any>,
  children?: React.ReactNode,
  skip?: boolean,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const captureInViewEvent = useCallback(
    useTracking({ eventType: eventType || "inViewEvent", eventProps: {...eventProps, ...observerProps}}).captureEvent,
    // absolutely no reason for eventType or props to change for InView tracker once created, easiest way to prevent rerender because of object props
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])
  const wrappedCaptureInViewEvent = useStabilizedCallback((entry: IntersectionObserverEntry) => {
    if (!skip) {
      const {time, isIntersecting, intersectionRatio} = entry
      captureInViewEvent(undefined, {time, isIntersecting, intersectionRatio})
    }
  })

  const { nodeRef } = useSubscribeIsInView(observerProps, wrappedCaptureInViewEvent)

  return <span ref={nodeRef}>
    { children }
  </span>
}

export default AnalyticsInViewTracker;


