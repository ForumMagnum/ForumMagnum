import { useState, useRef, useCallback } from 'react';
import { EventProps, useTracking } from "../../lib/analyticsEvents";
import { isMobile } from '../../lib/utils/isMobile'
import { useOnNavigateOrHide } from '../hooks/useOnNavigateOrHide';

function datesDifference(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

// A popper-compatible anchor. Either a real DOM element (standard case) or a
// virtual element that implements `getBoundingClientRect()` -- used when the
// hovered element is an inline box that wraps across multiple lines, so we can
// anchor the popper to the specific line segment the mouse is over rather than
// to the union bounding box (which can leave dead space between the hovered
// line and the popper -- see #m_bugs report 2026-04-09).
export type HoverAnchor = HTMLElement | {
  getBoundingClientRect: () => DOMRect,
  contextElement?: Element,
};

/**
 * Given an inline element and a mouse position, pick the `getClientRects()`
 * rect that contains the cursor and return a popper virtual element bound to
 * that specific rect. For elements with a single client rect (the common case)
 * just returns the element itself, preserving existing behavior.
 */
function getSegmentAnchor(el: HTMLElement, clientX: number, clientY: number): HoverAnchor {
  // getClientRects only reports multiple rects for inline boxes that wrap
  // across lines. For block-level anchors it returns a single rect, so we
  // fall through to returning the element itself (which preserves behavior
  // for all the non-inline-link hover call sites).
  const rects = el.getClientRects();
  if (rects.length <= 1) return el;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      const snapshot = r;
      return {
        getBoundingClientRect: () => snapshot,
        contextElement: el,
      };
    }
  }
  return el;
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
  anchorEl: HoverAnchor | null,
  forceUnHover: () => void,
} => {
  const {eventProps, onEnter, onLeave, disabledOnMobile, getIsEnabled} = options ?? {};
  const [hover, setHover] = useState(false)
  const [everHovered, setEverHovered] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HoverAnchor | null>(null)
  const delayTimer = useRef<NodeJS.Timeout | null>(null)
  const mouseOverStart = useRef<Date|null>(null)
  const hoveredRef = useRef(false);

  const { captureEvent } = useTracking({eventType:"hoverEventTriggered", eventProps})
  
  const captureHoverEvent = useCallback(() => {
    if (!isMobile()) {
      captureEvent("hoverEventTriggered",
        {timeToCapture: new Date()}
      )
    }
    if (delayTimer.current) clearTimeout(delayTimer.current)
  }, [captureEvent])

  const handleMouseOver = useCallback((event: MouseEvent|React.MouseEvent) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    if ((disabledOnMobile && isMobile()) || (getIsEnabled && !getIsEnabled())) {
      return;
    }

    // Mouseover also fires when moving between children. Keep callbacks outside
    // state updaters so React cannot replay them, including during restoration.
    if (!hoveredRef.current) {
      hoveredRef.current = true;
      onEnter?.();
    }
    setHover(true);
    setEverHovered(true);
    // If the hovered element is an inline anchor that wraps across multiple
    // lines, anchor the popper to the specific line segment the mouse is over
    // rather than to the overall bounding box. For non-wrapping elements this
    // is a no-op (getClientRects returns a single rect).
    setAnchorEl(getSegmentAnchor(target, event.clientX, event.clientY));
    mouseOverStart.current = new Date()
    if (delayTimer.current) clearTimeout(delayTimer.current)
    delayTimer.current = setTimeout(captureHoverEvent,500)
  }, [captureHoverEvent, onEnter, disabledOnMobile, getIsEnabled])

  /**
   * Simulate un-hovering, making this effectively not-hovered until the mouse
   * moves away and reenters. Used to make hover-menus close.
   */
  const forceUnHover = useCallback(() => {
    const wasHovered = hoveredRef.current;
    hoveredRef.current = false;
    setHover(false);
    setAnchorEl(null)
    if (delayTimer.current) clearTimeout(delayTimer.current)
    delayTimer.current = null;
    mouseOverStart.current = null;
    if (wasHovered) onLeave?.();
  }, [onLeave]);

  useOnNavigateOrHide(forceUnHover);

  const handleMouseLeave = useCallback(() => {
    const hoverStart = mouseOverStart.current;
    forceUnHover();
    if (hoverStart) {
      const hoverDuration = datesDifference(new Date(), hoverStart)
      if (hoverDuration > 2000) {
        captureEvent("hoverEventTriggered", {hoverEventType: "longHoverEvent", hoverDuration});
      }
    }
  }, [captureEvent, forceUnHover]);

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
