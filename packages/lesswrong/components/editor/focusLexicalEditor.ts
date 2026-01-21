export const focusLexicalEditor = (container: HTMLDivElement | null) => {
  if (!container) return;
  setTimeout(() => {
    const editorElement = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    editorElement?.focus?.();
  }, 0);
};
