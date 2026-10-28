// EXPERIMENT (experiment/iframe-layout-ronny-exp2): one pointer gesture at a time (moving or resizing
// an iframe widget). A transparent shield over the whole page captures the pointer, so the drag keeps
// reporting to the page while it crosses a widget's iframe (which would swallow the events otherwise).
// Nothing visible happens until the pointer has moved `threshold` px; a shorter press is a click.
import { autoScrollStep } from './widgetDragGeometry';

/** On <body> while a gesture is under way (see the global styles in IframeWidgetPlugin). */
export const DRAGGING_BODY_CLASS = 'lw-widget-dragging';

/**
 * The bottom of the part of the window that fixed bars along its bottom edge (the demo's tabs, marked
 * data-lw-bottom-bar) leave uncovered, with a 4px margin.
 */
export function visibleBottom(): number {
  let bottom = window.innerHeight;
  document.querySelectorAll('[data-lw-bottom-bar]').forEach((bar) => {
    const rect = bar.getBoundingClientRect();
    if (rect.height > 0 && rect.bottom > window.innerHeight - 120) bottom = Math.min(bottom, rect.top - 4);
  });
  return bottom;
}

/**
 * Focuses a grip after a gesture without showing its focus ring (focusVisible, where supported): the
 * keys (undo, above all) reach it, while the widget's controls stay hidden until the keyboard is used.
 */
export function focusQuietly(elem: HTMLElement | null | undefined): void {
  elem?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
}

export interface GesturePoint {
  x: number;
  y: number;
}

export interface GestureHandlers {
  cursor: 'grabbing' | 'ew-resize';
  /** How far (px) the pointer must move before the gesture starts. */
  threshold: number;
  /** 'x': only sideways movement counts toward the threshold (a resize ignores a vertical slip). */
  axis?: 'x';
  /** Scroll the page while the pointer is near the top or bottom of the window. */
  autoScroll: boolean;
  onStart: () => void;
  /** Every animation frame once started, with the latest pointer position (client coordinates). */
  onFrame: (point: GesturePoint) => void;
  /**
   * Released after it started (onFrame has just run with the final position). Returns whether it
   * changed the document.
   */
  onCommit: (point: GesturePoint) => boolean;
  /**
   * Escape, pointercancel, the window losing focus, the pointer capture lost, a context menu (mouse),
   * or a new press of the same pointer (its release was missed).
   */
  onCancel: () => void;
  /** Released before it started. */
  onClick?: () => void;
  /** Always last, however the gesture ended. */
  onEnd: () => void;
  /**
   * Gets the focus when the gesture ends if the shield had it (see below), or if the focus ended up on
   * <body>, however the gesture ended: after a click on the page margin, say, or because a grip that
   * had it (from an earlier drag) was hidden during this one. There the editor's undo shortcut would
   * never see the keys.
   */
  refocus?: () => HTMLElement | null;
}

/** Starts a gesture from a pointerdown. Returns a function that cancels it. */
export function startPointerGesture(down: PointerEvent, handlers: GestureHandlers): () => void {
  const shield = document.createElement('div');
  Object.assign(shield.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    zIndex: '2147483000',
    cursor: handlers.cursor,
    touchAction: 'none',
    background: 'transparent',
  });
  shield.dataset.lwDragShield = '';
  document.body.appendChild(shield);
  try {
    shield.setPointerCapture(down.pointerId);
  } catch {
    // The pointer is already up; the shield and the window listeners still see the rest.
  }
  // The grips and edges keep a press from moving the focus. So after a click inside a widget, its
  // iframe still has the keyboard, and Escape (and the window's blur) would never reach this page:
  // the shield takes the focus for the gesture.
  if (document.activeElement instanceof HTMLIFrameElement) {
    shield.tabIndex = -1;
    shield.style.outline = 'none';
    shield.focus({ preventScroll: true });
  }

  const origin = { x: down.clientX, y: down.clientY };
  let last: GesturePoint = { ...origin };
  let started = false;
  let done = false;
  let frame = 0;

  const passedThreshold = () => (handlers.axis === 'x'
    ? Math.abs(last.x - origin.x)
    : Math.hypot(last.x - origin.x, last.y - origin.y)) >= handlers.threshold;
  const start = () => {
    if (started) return;
    started = true;
    document.body.classList.add(DRAGGING_BODY_CLASS);
    handlers.onStart();
  };

  // Never checks e.buttons: synthesized (test) pointer events may leave it out. A release that never
  // arrives is caught by onContextMenu and onDown below instead.
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== down.pointerId || done) return;
    last = { x: e.clientX, y: e.clientY };
    if (!started && passedThreshold()) start();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== down.pointerId || done) return;
    last = { x: e.clientX, y: e.clientY };
    if (!started && passedThreshold()) start();
    finish('up');
  };
  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId === down.pointerId) finish('cancel');
  };
  // Escape cancels. Every other key is swallowed: the editor keeps the focus during a mouse drag, and
  // an undo or typed text would change the document under the widget being held.
  const onKey = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') finish('cancel');
  };
  const onBlur = () => finish('cancel');
  // After a normal release pointerup has already finished the gesture, so this does nothing then.
  const onLostCapture = () => setTimeout(() => finish('cancel'), 0);
  // A context menu takes the rest of a mouse press (macOS opens one on Control-click), so the release
  // would never arrive: that ends the gesture, and the menu opens. On a touch screen it comes from a
  // long press, which is just a slow start to a drag, so there the menu is held back instead.
  const onContextMenu = (e: MouseEvent) => {
    if (down.pointerType === 'mouse') finish('cancel');
    else e.preventDefault();
  };
  // A new press of the same pointer means its release was missed somehow: drop the gesture rather
  // than let that click commit it.
  const onDown = (e: PointerEvent) => {
    if (e.pointerId === down.pointerId) finish('cancel');
  };

  const tick = () => {
    frame = 0;
    if (done) return;
    if (started) {
      if (handlers.autoScroll) {
        // The bottom zone starts above the demo's bottom bar, where the drop line would be hidden.
        const dy = autoScrollStep(last.y, visibleBottom());
        if (dy) window.scrollBy(0, dy);
      }
      try {
        handlers.onFrame(last);
      } catch (err) {
        finish('cancel');
        throw err;
      }
    }
    if (!done) frame = requestAnimationFrame(tick);
  };

  function teardown() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onPointerCancel, true);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('contextmenu', onContextMenu, true);
    window.removeEventListener('pointerdown', onDown, true);
    shield.removeEventListener('lostpointercapture', onLostCapture);
    const hadFocus = document.activeElement === shield;
    const unfocused = !document.activeElement || document.activeElement === document.body;
    shield.remove();
    // (After the class is gone: the grips are hidden during a gesture, and a hidden one can't be focused.)
    document.body.classList.remove(DRAGGING_BODY_CLASS);
    if (hadFocus || unfocused) focusQuietly(handlers.refocus?.());
  }

  function finish(reason: 'up' | 'cancel') {
    if (done) return;
    done = true;
    try {
      if (reason === 'up' && started) {
        handlers.onFrame(last);
        handlers.onCommit(last);
      } else if (reason === 'up') {
        handlers.onClick?.();
      } else {
        handlers.onCancel();
      }
    } finally {
      teardown();
      handlers.onEnd();
    }
  }

  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onPointerCancel, true);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('blur', onBlur);
  window.addEventListener('contextmenu', onContextMenu, true);
  // Added while the starting press is being handled, after its own window capture phase.
  window.addEventListener('pointerdown', onDown, true);
  shield.addEventListener('lostpointercapture', onLostCapture);
  frame = requestAnimationFrame(tick);

  return () => finish('cancel');
}
