// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { useCallback, useState } from "react";

export const useCallbackRefState = <T>() => {
  const [refValue, setRefValue] = useState<T | null>(null);
  const refCallback = useCallback((value: T | null) => setRefValue(value), []);
  return [refValue, refCallback] as const;
};
