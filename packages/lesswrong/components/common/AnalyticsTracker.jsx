import { registerComponent } from 'meteor/vulcan:core';
import React, { useCallback } from 'react';
import { useTracking } from "../../lib/analyticsEvents";

const mouseButtonDecoding = {
  0: 'main_button',
  1: 'auxilliary_button',
  2: 'secondary_button',
}
const AnalyticsTracker = ({eventType, eventProps, children, captureOnClick=true, captureOnMount, skip}) => {
  const { captureEvent } = useTracking({eventType, eventProps, captureOnMount})
  const handleClick = useCallback((e) => {
    !skip && captureOnClick && captureEvent(`${eventType}Clicked`,
        {...eventProps, buttonPressed: mouseButtonDecoding[e.button] || e.button})
  }, [eventProps, captureEvent, skip, captureOnClick, eventType])

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

registerComponent('AnalyticsTracker', AnalyticsTracker)
