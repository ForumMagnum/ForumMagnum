import { useCallback, useRef } from "react";

/**
 * Behaves identically to useCallback, except that when the resulting function
 * is different because one of the deps is different, it console logs a message
 * with `description` and the indexes of all the changed deps.
 *
 * Note that the eslint rule react-hooks/exhautive-deps is *not* able to
 * recognize that this is the same as useCallback, so it is not safe to use
 * except as a debugging tool.
 */
export function useCallbackDebugRerenders<T extends (...args: any[]) => any>(fn: T, deps: any[], description?: string): T {
  const lastDeps = useRef(deps);
  const depsChanged: number[] = [];
  for (let i=0; i<deps.length; i++) {
    if (deps[i] !== lastDeps.current[i]) {
      depsChanged.push(i);
    }
  }
  if (depsChanged.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`${description ?? "useCallbackDebugRerenders"} changed: deps ${depsChanged.join(", ")}`);
  }
  lastDeps.current = [...deps];
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(fn, deps);
}
