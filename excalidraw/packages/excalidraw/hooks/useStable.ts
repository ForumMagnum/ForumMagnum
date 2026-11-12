// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { useRef } from "react";

export const useStable = <T extends Record<string, any>>(value: T) => {
  const ref = useRef<T>(value);
  Object.assign(ref.current, value);
  return ref.current;
};
