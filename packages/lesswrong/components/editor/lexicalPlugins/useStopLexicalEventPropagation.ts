import { useEffect, type RefObject } from 'react';

/**
 * Lexical attaches native keydown / beforeinput / mouse listeners on the
 * editor root that handle events as editor commands (e.g. Cmd+Z → undo,
 * Opt+Backspace → delete word). When a user interacts with a React widget
 * we've embedded inside the editor (e.g. an <input> or <select> in a
 * DecoratorNode), those events bubble up to the root and get consumed by
 * Lexical before our widget can process them, breaking undo, word-delete
 * shortcuts, normal typing, and selection.
 *
 * Stop propagation at the widget element using *native* listeners (React's
 * synthetic events fire after native bubbling has already delivered the
 * event to Lexical's handlers).
 */
export function useStopLexicalEventPropagation<E extends HTMLElement>(
  ref: RefObject<E | null>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const stop = (e: Event) => e.stopPropagation();
    const events = ['keydown', 'keyup', 'keypress', 'beforeinput', 'mousedown', 'pointerdown'] as const;
    for (const event of events) el.addEventListener(event, stop);
    return () => {
      for (const event of events) el.removeEventListener(event, stop);
    };
  }, [ref]);
}
