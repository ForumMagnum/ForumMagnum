import { isLWorAF } from '../../lib/instanceSettings';

const hasActivateOnPress = isLWorAF;

/**
 * Utility function for managing forum-gating of activate-on-press behavior.
 *
 * When handling a click on a link or button, you can either act when the mouse
 * button is pressed, or when it's released. If you activate on press, this is
 * more responsive, but you can't also handle click-and-drag.
 *
 * Activate on release is a common default; we change this to
 * activate-on-press, but this is currently forum-gated (LW/AF only). This is
 * in the form of a hook because we might in the future make it a user setting.
 *
 * When acting on press with an <a> take, we need to act in the onMouseDown
 * event handler and call preventDefault in the onClick handler. This returns
 * an onActivateEventHandlers function, which sets up both of these event
 * handlers; you call and spread into a component like tihs:
 *
 *   <a {...onActivateEventHandlers(doSomething)} href="#">link text</a>
 *
 * By convention, if a component takes an `onActivate` or a `doOnDown` prop, it
 * contains its own forum-gated decision about whether to activate on press or
 * on release; if a component does not take either of those props but takes
 * `onClick`/`onMouseDown`, the caller is responsible for the decision.
 */
export function useActivateOnPress(): {
  activateOnPress: boolean,
  onActivateEventHandlers: (fn: ((ev: React.MouseEvent) => void)|null|undefined) => {
    onMouseDown: React.MouseEventHandler|undefined
    onClick: React.MouseEventHandler
  }
} {
  if (hasActivateOnPress) {
    return {
      activateOnPress: true,
      onActivateEventHandlers: (fn) => ({
        onMouseDown: fn ?? undefined,
        onClick: (ev) => {
          ev.preventDefault();
        }
      })
    }
  } else {
    return {
      activateOnPress: false,
      onActivateEventHandlers: (fn) => ({
        onMouseDown: undefined,
        onClick: (ev) => {
          ev.preventDefault();
          fn?.(ev);
        }
      })
    }
  }
}
