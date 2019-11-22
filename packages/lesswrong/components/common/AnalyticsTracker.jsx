import { registerComponent } from 'meteor/vulcan:core';
import React, { useEffect } from 'react';
import {captureEvent} from "../../lib/analyticsEvents";

const AnalyticsTracker = ({eventType, eventProps, children, onClick, onRender, skip}) => {

  const handleClick = () => {
    !skip && onClick && captureEvent(eventType + "Clicked", eventProps)
  }

  useEffect(
      () => {onRender && captureEvent(eventType + "Displayed", eventProps)},
      []
  )

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

registerComponent('AnalyticsTracker', AnalyticsTracker)
