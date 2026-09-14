import { useState, useRef, useCallback, useEffect } from 'react';
import { EventProps, useTracking } from "../../lib/analyticsEvents";
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

/**
 * How a hover responds to touch input, where there is no real hover. Touch
 * browsers synthesize mouse events on tap, so without special handling a tap
 * both opens the hover and activates whatever was tapped, and nothing closes
 * the hover afterwards.
 *
 * - "hidden": touch never opens the hover. The right choice for hints that
 *   explain a button, where the tap should just perform the action.
 * - "toggle": a tap opens the hover and that tap's click is swallowed, so a
 *   wrapped link does not navigate and a wrapped button does not fire. A tap
 *   outside the anchor and the popper closes it. While it is open, a tap on the
 *   anchor closes it and passes through normally. The right choice for content
 *   that is only available in the hover, such as user cards, tag previews and
 *   karma breakdowns.
 */
export type HoverTouchBehavior = "hidden" | "toggle";

export interface UseHoverEventHandlers {
  onPointerOver: (ev: PointerEvent|React.PointerEvent) => void,
  onPointerLeave: (ev: PointerEvent|React.PointerEvent) => void,
  onPointerDown: (ev: PointerEvent|React.PointerEvent) => void,
  onClickCapture: (ev: MouseEvent|React.MouseEvent) => void,
};

function isTouchPointer(ev: PointerEvent|React.PointerEvent): boolean {
  return ev.pointerType === "touch";
}

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
   * How this hover responds to touch input. Defaults to "hidden". See
   * HoverTouchBehavior.
   */
  touch?: HoverTouchBehavior,
}): {
  eventHandlers: UseHoverEventHandlers,
  hover: boolean,
  everHovered: boolean,
  anchorEl: HoverAnchor | null,
  forceUnHover: () => void,
} => {
  const {eventProps, onEnter, onLeave, getIsEnabled, touch="hidden"} = options ?? {};
  const [hover, setHover] = useState(false)
  const [everHovered, setEverHovered] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HoverAnchor | null>(null)
  const delayTimer = useRef<NodeJS.Timeout | null>(null)
  const mouseOverStart = useRef<Date|null>(null)
  const hoveredRef = useRef(false);
  // The pointer type of the most recent pointerdown on the anchor (or inside
  // its popper), so that the following click can tell whether it came from a
  // touch. Click events don't reliably carry pointerType across browsers.
  const lastPointerTypeRef = useRef<string|null>(null);
  // The most recent native pointerdown that happened inside the anchor or its
  // popper. The document-level tap-away listener uses this to tell inside from
  // outside, which works across portals because React propagates events
  // through the React tree rather than the DOM tree.
  const insidePointerDownRef = useRef<Event|null>(null);

  const { captureEvent } = useTracking({eventType:"hoverEventTriggered", eventProps})
  
  const captureHoverEvent = useCallback(() => {
    captureEvent("hoverEventTriggered",
      {timeToCapture: new Date()}
    )
    if (delayTimer.current) clearTimeout(delayTimer.current)
  }, [captureEvent])

  const open = useCallback((target: HTMLElement, clientX: number, clientY: number) => {
    // Pointerover also fires when moving between children. Keep callbacks outside
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
    setAnchorEl(getSegmentAnchor(target, clientX, clientY));
  }, [onEnter]);

  const handlePointerOver = useCallback((event: PointerEvent|React.PointerEvent) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    // Touch has no hover; a touch pointerover is just the start of a tap. The
    // tap is handled in handleClickCapture according to the touch behavior.
    if (isTouchPointer(event)) return;
    if (getIsEnabled && !getIsEnabled()) return;

    open(target, event.clientX, event.clientY);
    mouseOverStart.current = new Date()
    if (delayTimer.current) clearTimeout(delayTimer.current)
    delayTimer.current = setTimeout(captureHoverEvent,500)
  }, [captureHoverEvent, open, getIsEnabled])

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

  const handlePointerLeave = useCallback((event: PointerEvent|React.PointerEvent) => {
    // A touch pointer "leaves" as soon as the finger lifts, which must not
    // close a hover that was opened by that tap (or by a real mouse).
    if (isTouchPointer(event)) return;
    const hoverStart = mouseOverStart.current;
    forceUnHover();
    if (hoverStart) {
      const hoverDuration = datesDifference(new Date(), hoverStart)
      if (hoverDuration > 2000) {
        captureEvent("hoverEventTriggered", {hoverEventType: "longHoverEvent", hoverDuration});
      }
    }
  }, [captureEvent, forceUnHover]);

  const handlePointerDown = useCallback((event: PointerEvent|React.PointerEvent) => {
    lastPointerTypeRef.current = event.pointerType;
    insidePointerDownRef.current = "nativeEvent" in event ? event.nativeEvent : event;
  }, []);

  // Runs in the capture phase, before any click handler on the tapped element,
  // so that the tap which opens a "toggle" hover can be swallowed entirely.
  const handleClickCapture = useCallback((event: MouseEvent|React.MouseEvent) => {
    const pointerType = lastPointerTypeRef.current;
    lastPointerTypeRef.current = null;
    if (pointerType !== "touch") return;
    if (touch !== "toggle") return;
    if (getIsEnabled && !getIsEnabled()) return;
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLElement)) return;
    // Clicks inside the popper also arrive here (React propagates through
    // portals). Those belong to the popper's contents; only taps on the anchor
    // itself toggle the hover.
    if (!(event.target instanceof Node) || !anchor.contains(event.target)) return;

    if (hoveredRef.current) {
      forceUnHover();
      return;
    }
    open(anchor, event.clientX, event.clientY);
    event.preventDefault();
    event.stopPropagation();
  }, [touch, getIsEnabled, open, forceUnHover]);

  // While open, a pointerdown anywhere other than the anchor or its popper
  // closes the hover. This is what lets touch users dismiss a hover; for mouse
  // users it is redundant with pointerleave and harmless.
  useEffect(() => {
    if (!hover) return;
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (event === insidePointerDownRef.current) return;
      forceUnHover();
    };
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () => document.removeEventListener("pointerdown", onDocumentPointerDown);
  }, [hover, forceUnHover]);

  return {
    eventHandlers: {
      onPointerOver: handlePointerOver,
      onPointerLeave: handlePointerLeave,
      onPointerDown: handlePointerDown,
      onClickCapture: handleClickCapture,
    },
    hover,
    everHovered,
    anchorEl,
    forceUnHover,
  }
}
