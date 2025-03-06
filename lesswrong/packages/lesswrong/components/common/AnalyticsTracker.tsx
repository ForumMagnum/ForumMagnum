import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useCallback } from 'react';
import { useOnMountTracking } from "../../lib/analyticsEvents";

const AnalyticsTracker = ({eventType, eventProps, children, captureOnClick=true, captureOnMount, skip}: {
  eventType: string,
  eventProps?: Record<string,any>,
  children?: React.ReactNode,
  captureOnClick?: boolean,
  captureOnMount?: ((eventData: Record<string,any>) => boolean)|boolean,
  skip?: boolean,
}) => {
  const { captureEvent } = useOnMountTracking({eventType, eventProps, captureOnMount})
  const handleClick = useCallback((e: React.MouseEvent) => {
    !skip && captureOnClick && captureEvent(`${eventType}Clicked`,
        {...eventProps, buttonPressed: e.button})
  }, [eventProps, captureEvent, skip, captureOnClick, eventType])

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

const AnalyticsTrackerComponent = registerComponent('AnalyticsTracker', AnalyticsTracker)

declare global {
  interface ComponentTypes {
    AnalyticsTracker: typeof AnalyticsTrackerComponent
  }
}

export default AnalyticsTrackerComponent;
