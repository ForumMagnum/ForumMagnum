import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useTracking } from "../../lib/analyticsEvents";

const AnalyticsTracker = ({eventType, eventProps, children, captureOnClick, captureOnMount, skip}) => {
  const { captureEvent } = useTracking({eventType, eventProps, captureOnMount})
  const handleClick = () => {
    !skip && captureOnClick && captureEvent(`${eventType}Clicked`, eventProps)
  }

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

registerComponent('AnalyticsTracker', AnalyticsTracker)
