import { useState, useRef, useCallback } from 'react';
import { EventProps, useTracking } from "../../lib/analyticsEvents";
import { isMobile } from '../../lib/utils/isMobile'

function datesDifference(a: Date, b: Date): number {
  return (a as any)-(b as any);
}

type UseHoverProps = {
  eventProps?: EventProps,
  onEnter?: () => void,
  onLeave?: () => void,
  disabledOnMobile?: boolean,
}

export type UseHoverEventHandlers = {
  onMouseOver: (ev: React.MouseEvent) => void,
  onMouseLeave: (ev: React.MouseEvent) => void,
}

export const useHover = <EventType extends {currentTarget: Element}=React.MouseEvent>({eventProps, onEnter, onLeave, disabledOnMobile}: UseHoverProps = {}): {
  eventHandlers: {
    onMouseOver: (ev: EventType) => void,
    onMouseLeave: (ev: EventType) => void,
  }
  hover: boolean,
  everHovered: boolean,
  anchorEl: any,
  forceUnHover: () => void,
} => {
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

  const handleMouseOver = useCallback((event: EventType) => {
    if (disabledOnMobile && isMobile()) {
      return;
    }

    setHover((currentValue) => {
      // Sometimes the event is retriggered by moving the mouse inside the
      // hovered element, if the hovered element contains children which can
      // take the mouse focus. We only want to trigger `onEnter` the first time
      // the mouse enters.
      if (!currentValue) {
        onEnter?.();
      }
      return true;
    });
    setEverHovered(true);
    setAnchorEl(event.currentTarget);
    mouseOverStart.current = new Date()
    clearTimeout(delayTimer.current)
    delayTimer.current = setTimeout(captureHoverEvent,500)
  }, [captureHoverEvent, onEnter, disabledOnMobile])

  const handleMouseLeave = useCallback(() => {
    setHover((currentValue) => {
      if (currentValue) {
        onLeave?.();
      }
      return false;
    });
    setAnchorEl(null)
    clearTimeout(delayTimer.current)

    if (mouseOverStart.current) {
      const hoverDuration = datesDifference(new Date(), mouseOverStart.current)
      if (hoverDuration > 2000) {
        captureEvent("hoverEventTriggered", {hoverEventType: "longHoverEvent", hoverDuration});
      }
      mouseOverStart.current = null
    }
  },[captureEvent, onLeave])

  /**
   * Simulate un-hovering, making this effectively not-hovered until the mouse
   * moves away and reenters. Used to make hover-menus close.
   */
  const forceUnHover = useCallback(() => {
    setHover((currentValue) => {
      if (currentValue) {
        onLeave?.();
      }
      return false;
    });
    setAnchorEl(null)
    clearTimeout(delayTimer.current)
  }, [onLeave]);

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
