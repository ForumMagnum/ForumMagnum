import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useTracking } from "../../lib/analyticsEvents";

const AnalyticsTracker = ({eventType, eventProps, children, captureOnClick, captureOnMount, skip}) => {
  const { captureEvent } = useTracking({eventType, eventProps, captureOnMount})
  const buttonDecoding  = (code) => {
    switch (code) {
      case 0:
        return 'main_button'
      case 1:
        return 'auxilliary_button'
      case 2:
        return 'secondary_button'
      default:
        return code
    }
  }
  const handleClick = (e) => {
    !skip && captureOnClick && captureEvent(`${eventType}Clicked`,
        {...eventProps, buttonPressed: buttonDecoding(e.button)})
  }

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

registerComponent('AnalyticsTracker', AnalyticsTracker)
