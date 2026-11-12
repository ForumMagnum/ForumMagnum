// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import React, { useCallback } from "react";

/** noop polyfill for v17. Subset of API available */
function useTransitionPolyfill() {
  const startTransition = useCallback((callback: () => void) => callback(), []);
  return [false, startTransition] as const;
}

export const useTransition = React.useTransition || useTransitionPolyfill;
