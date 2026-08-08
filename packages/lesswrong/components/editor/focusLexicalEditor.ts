export const focusLexicalEditor = (container: HTMLDivElement | null) => {
  if (!container) return;
  setTimeout(() => {
    const editorElement = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    editorElement?.focus?.();
  }, 0);
};

const FOCUS_RETRY_INTERVAL_MS = 50;
const FOCUS_RETRY_ATTEMPTS = 20;

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
