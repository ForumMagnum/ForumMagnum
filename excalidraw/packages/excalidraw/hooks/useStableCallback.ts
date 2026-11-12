// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { useRef } from "react";

/**
 * Returns a stable function of the same type.
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  userFn: T,
) => {
  const stableRef = useRef<{ userFn: T; stableFn?: T }>({ userFn });
  stableRef.current.userFn = userFn;

  if (!stableRef.current.stableFn) {
    stableRef.current.stableFn = ((...args: any[]) =>
      stableRef.current.userFn(...args)) as T;
  }

  return stableRef.current.stableFn as T;
};
