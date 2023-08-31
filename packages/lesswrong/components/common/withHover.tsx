import React, {useState, useRef, useCallback } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { isMobile } from '../../lib/utils/isMobile'

function datesDifference(a:Date, b:Date): number {
  return (a as any)-(b as any);
}

export const withHover = (trackingData?: any, propsToTrackingData?: any) => {
  return <P extends {}>(WrappedComponent: React.FunctionComponent<P>) => (props: P) => {
    const eventProps = {...trackingData, ...(propsToTrackingData || ((props: P)=>{}))(props)};
    const { eventHandlers, hover, anchorEl } = useHover(eventProps);
    return (
      <span {...eventHandlers}>
        <WrappedComponent {...props} hover={hover} anchorEl={anchorEl}/>
      </span>
    );
  }
}

export const useHover = (eventProps?: Record<string,any>) => {
  const [hover, setHover] = useState(false)
  const [everHovered, setEverHovered] = useState(false)
  const [anchorEl, setAnchorEl] = useState<any>(null)
  const delayTimer = useRef<any>(null)
  const mouseOverStart = useRef<Date|null>(null)

  const { captureEvent } = useTracking({eventType:"hoverEventTriggered", eventProps})

  const captureHoverEvent = useCallback(() => {
    if (!isMobile()) {
      captureEvent("hoverEventTriggered",
        {timeToCapture: new Date()}
      )
    }
    clearTimeout(delayTimer.current)
  }, [captureEvent])

  const handleMouseOver = useCallback((event) => {
    setHover(true)
    setEverHovered(true);
    setAnchorEl(event.currentTarget);
    mouseOverStart.current = new Date()
    clearTimeout(delayTimer.current)
    delayTimer.current = setTimeout(captureHoverEvent,500)
  }, [captureHoverEvent])

  const handleMouseLeave = useCallback(() => {
    setHover(false)
    setAnchorEl(null)
    clearTimeout(delayTimer.current)

    if (mouseOverStart.current) {
      const hoverDuration = datesDifference(new Date(), mouseOverStart.current)
      if (hoverDuration > 2000) {
        captureEvent("hoverEventTriggered", {hoverEventType: "longHoverEvent", hoverDuration});
      }
      mouseOverStart.current = null
    }
  },[captureEvent])
  
  /**
   * Simulate un-hovering, making this effectively not-hovered until the mouse
   * moves away and reenters. Used to make hover-menus close.
   */
  const forceUnHover = useCallback(() => {
    setHover(false)
    setAnchorEl(null)
    clearTimeout(delayTimer.current)
  }, []);
  
  return {
    eventHandlers: {
      onMouseOver: handleMouseOver,
      onMouseLeave: handleMouseLeave,
    },
    hover,
    everHovered,
    anchorEl,
    forceUnHover,
  }
}

export default withHover
