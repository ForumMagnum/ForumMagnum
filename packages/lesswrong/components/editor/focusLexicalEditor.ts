import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const FOCUS_RETRY_INTERVAL_MS = 50;
const FOCUS_RETRY_ATTEMPTS = 20;

export const focusLexicalEditor = (container: HTMLDivElement | null) => {
  if (!container) return;
  setTimeout(() => {
    const editorElement = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    editorElement?.focus?.();
  }, 0);
};

/**
 * Focus an editor with the caret at the end of its contents. A plain
 * `.focus()` leaves the caret wherever the browser puts it (usually the
 * start), which is the wrong place when arriving from below the editor.
 * Retries briefly in case the editor is still mounting (dynamic import).
 */
export const focusLexicalEditorAtEnd = (container: HTMLDivElement | null) => {
  if (!container) return;

  let attemptsRemaining = FOCUS_RETRY_ATTEMPTS;

  const attemptFocus = () => {
    const editorElement = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    if (!editorElement) {
      if (attemptsRemaining-- > 0) {
        setTimeout(attemptFocus, FOCUS_RETRY_INTERVAL_MS);
      }
      return;
    }
    editorElement.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editorElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  setTimeout(attemptFocus, 0);
};

/**
 * Focus an editor that may not have mounted yet (dynamic import, template
 * fetch) by retrying briefly. Returns a cancel function.
 */
export const focusLexicalEditorWhenReady = (container: HTMLDivElement | null) => {
  if (!container) return () => {};

  let attemptsRemaining = FOCUS_RETRY_ATTEMPTS;
  let timeoutId: ReturnType<typeof setTimeout>;

  const attemptFocus = () => {
    const editorElement = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    if (editorElement) {
      editorElement.focus?.();
      return;
    }
    if (attemptsRemaining-- > 0) {
      timeoutId = setTimeout(attemptFocus, FOCUS_RETRY_INTERVAL_MS);
    }
  };

  timeoutId = setTimeout(attemptFocus, 0);
  return () => clearTimeout(timeoutId);
};

/**
 * For keydown listeners on a composer container in the supermod sidebar: a
 * bare Escape blurs the editor instead of reaching the supermod shortcut
 * handler on document, which would otherwise close the user detail view.
 * Once the editor is blurred, ArrowUp/ArrowDown navigate the content list
 * again. React's own listener is on document too, so only
 * stopImmediatePropagation keeps the event from reaching it.
 * Returns whether the event was a bare Escape (so callers can react to it).
 */
export const blurEditorOnEscape = (event: ReactKeyboardEvent) => {
  if (event.key !== 'Escape' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
  event.preventDefault();
  event.nativeEvent.stopImmediatePropagation();
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  return true;
};

/**
 * For keydown listeners on an editor container: if the pressed key was a bare
 * ArrowDown and the caret doesn't move as a result (i.e. it was already on the
 * last line of the editor), call `onArrowDownPastEnd`. Whether the caret moved
 * is checked on the next tick, after the browser's default caret movement, so
 * wrapped lines inside a paragraph behave correctly.
 */
export const callOnArrowDownPastEditorEnd = (event: ReactKeyboardEvent, onArrowDownPastEnd: () => void) => {
  if (event.key !== 'ArrowDown' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  if (!(event.target instanceof HTMLElement) || !event.target.isContentEditable) return;
  // Deliberately no `event.defaultPrevented` check: Lexical's rich-text
  // KEY_ARROW_DOWN_COMMAND handler preventDefaults exactly when the selection
  // is at the end of the document (to keep the page from scrolling), which is
  // precisely the state this helper is trying to detect. Typeahead popups
  // (mentions, slash commands) also consume ArrowDown while navigating, but
  // they call stopImmediatePropagation (see the vendored LexicalMenu), so
  // those events never bubble to this handler in the first place.
  const selection = window.getSelection();
  if (!selection) return;
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  setTimeout(() => {
    const selectionAfter = window.getSelection();
    if (!selectionAfter) return;
    const caretDidNotMove = selectionAfter.anchorNode === anchorNode
      && selectionAfter.anchorOffset === anchorOffset
      && selectionAfter.focusNode === focusNode
      && selectionAfter.focusOffset === focusOffset;
    if (caretDidNotMove) {
      onArrowDownPastEnd();
    }
  }, 0);
};
