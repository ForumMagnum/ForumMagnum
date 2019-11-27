import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useTracking } from "../../lib/analyticsEvents";

const AnalyticsTracker = ({eventType, eventProps, children, onClick, onRender: onMount, skip}) => {
  const { captureEvent } = useTracking({onMount, extraData: eventProps})
  const handleClick = () => {
    !skip && onClick && captureEvent(eventType + "Clicked", eventProps)
  }

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

registerComponent('AnalyticsTracker', AnalyticsTracker)
