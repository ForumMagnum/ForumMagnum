import { useState, useRef, useCallback, useEffect } from 'react';
import { EventProps, useTracking } from "../../lib/analyticsEvents";
import { isMobile } from '../../lib/utils/isMobile'

function datesDifference(a: Date, b: Date): number {
  return (a as any)-(b as any);
}

export interface UseHoverEventHandlers {
  onMouseOver: (ev: MouseEvent|React.MouseEvent) => void,
  onMouseLeave: (ev: MouseEvent|React.MouseEvent) => void,
};

/**
 * Returns a set of event handlers for implementing a hover effect. Spread
 * eventHandlers into the props of a DOM element; the component that used this
 * hook will rerender whenever that element is hovered or unhovered.
 */
export const useHover = (options?: {
  /**
   * Information attached to analytics events for this hover
   */
  eventProps?: EventProps,
  onEnter?: () => void,
  onLeave?: () => void,
  /**
   * Getter for whether the hover is enabled (checked when a hover event occurs,
   * if this returns false the hover is ignored). Given as a function rather
   * than a boolean so that it can do things like check the screen width,
   * without having to set up any change-listeners or worry about SSR mismatch.
   */
  getIsEnabled?: () => boolean,
  /**
   * Whether to disable this hover on touch devices (note, it's specifically
   * about whether it's a touch device, _not_ about screen size). Equivalent to
   * passing getIsEnabled={() => !isMobile()}.
   */
  disabledOnMobile?: boolean,
}): {
  eventHandlers: UseHoverEventHandlers,
  hover: boolean,
  everHovered: boolean,
  anchorEl: HTMLElement | null,
  forceUnHover: () => void,
} => {
  const {eventProps, onEnter, onLeave, disabledOnMobile, getIsEnabled} = options ?? {};
  const [hover, setHover] = useState(false)
  const [everHovered, setEverHovered] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const delayTimer = useRef<any>(null)
  const mouseOverStart = useRef<Date|null>(null)

  const { captureEvent } = useTracking({eventType:"hoverEventTriggered", eventProps})
  
  // On unmount, unhover. This is necessary when <Activity> is used (including
  // implicitly by nextjs) because that breaks the assumption that an element
  // which has seen a mouseOver event is still hovered so long as it hasn't seen
  // a mouseLeave event.
  useEffect(() => {
    return () => {
      setHover(false);
      setAnchorEl(null);
    }
  //eslint-disable-next-line
  }, []);

  const captureHoverEvent = useCallback(() => {
    if (!isMobile()) {
      captureEvent("hoverEventTriggered",
        {timeToCapture: new Date()}
      )
    }
    clearTimeout(delayTimer.current)
  }, [captureEvent])

  const handleMouseOver = useCallback((event: MouseEvent|React.MouseEvent) => {
    if ((disabledOnMobile && isMobile()) || (getIsEnabled && !getIsEnabled())) {
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
    setAnchorEl(event.currentTarget as HTMLElement);
    mouseOverStart.current = new Date()
    clearTimeout(delayTimer.current)
    delayTimer.current = setTimeout(captureHoverEvent,500)
  }, [captureHoverEvent, onEnter, disabledOnMobile, getIsEnabled])

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
