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
 * A Popper-compatible virtual element that positions a popper relative to one
 * specific line segment of an inline element, rather than that element's
 * overall bounding box. Used to avoid dead space when hovering an inline link
 * whose text wraps across multiple lines: getBoundingClientRect() returns the
 * rect containing the mouse position when the hover started, so the popper
 * card is placed directly beneath the hovered line segment instead of below
 * the combined bounding box of all segments.
 */
type LineAnchorVirtualElement = {
  __lineAnchorTarget: HTMLElement,
  contextElement: HTMLElement,
  readonly isConnected: boolean,
  getBoundingClientRect: () => DOMRect,
};

const makeLineAnchorVirtualElement = (
  target: HTMLElement,
  mouseX: number,
  mouseY: number,
): LineAnchorVirtualElement => ({
  __lineAnchorTarget: target,
  contextElement: target,
  get isConnected() { return target.isConnected; },
  getBoundingClientRect() {
    // If getClientRects isn't available (very old browsers / jsdom), fall back.
    if (typeof target.getClientRects !== 'function') {
      return target.getBoundingClientRect();
    }
    const rects = Array.from(target.getClientRects());
    if (rects.length <= 1) {
      return rects[0] ?? target.getBoundingClientRect();
    }
    // Pick the line segment that actually contained the mouse when the hover
    // started. This is what the user visually associates the popper with.
    for (const rect of rects) {
      if (
        mouseX >= rect.left && mouseX <= rect.right &&
        mouseY >= rect.top && mouseY <= rect.bottom
      ) {
        return rect;
      }
    }
    // Fallback: nearest segment by vertical distance to the mouse. Matches
    // the rect the mouse just left if the user moved between lines during
    // the brief window before the popper opens.
    let bestRect = rects[0];
    let bestDistance = Infinity;
    for (const rect of rects) {
      const midY = (rect.top + rect.bottom) / 2;
      const distance = Math.abs(mouseY - midY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRect = rect;
      }
    }
    return bestRect;
  },
});

const isLineAnchorVirtualElement = (
  value: unknown,
): value is LineAnchorVirtualElement => (
  !!value
  && typeof value === 'object'
  && '__lineAnchorTarget' in (value as object)
);

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
  /**
   * If true, the returned anchorEl is a Popper virtual element that positions
   * the popper against the specific text-line segment of the hovered element
   * that contains the mouse. Use this for hover popovers on inline links: if
   * the link text wraps across lines, the popper will appear beneath the
   * actually-hovered line rather than beneath the overall bounding box (which
   * leaves unreachable dead space between the first line and the popper card).
   */
  useLineAnchor?: boolean,
}): {
  eventHandlers: UseHoverEventHandlers,
  hover: boolean,
  everHovered: boolean,
  anchorEl: HTMLElement | LineAnchorVirtualElement | null,
  forceUnHover: () => void,
} => {
  const {eventProps, onEnter, onLeave, disabledOnMobile, getIsEnabled, useLineAnchor} = options ?? {};
  const [hover, setHover] = useState(false)
  const [everHovered, setEverHovered] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | LineAnchorVirtualElement | null>(null)
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
    const target = event.currentTarget as HTMLElement;
    if (useLineAnchor) {
      const mouseX = (event as React.MouseEvent).clientX;
      const mouseY = (event as React.MouseEvent).clientY;
      setAnchorEl((prev) => {
        // Keep the existing virtual element stable if we're still hovering the
        // same target. mouseOver can retrigger when moving between child
        // elements, and we don't want the popper to jitter between lines.
        if (isLineAnchorVirtualElement(prev) && prev.__lineAnchorTarget === target) {
          return prev;
        }
        return makeLineAnchorVirtualElement(target, mouseX, mouseY);
      });
    } else {
      setAnchorEl(target);
    }
    mouseOverStart.current = new Date()
    clearTimeout(delayTimer.current)
    delayTimer.current = setTimeout(captureHoverEvent,500)
  }, [captureHoverEvent, onEnter, disabledOnMobile, getIsEnabled, useLineAnchor])

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
