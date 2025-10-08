import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a function that checks whether the component that called the hook is
 * still mounted. Used with components that set timers.
 */
export const useIsMounted = (): {
  getIsMounted: () => boolean
} => {
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    }
  }, []);
  
  return {
    getIsMounted: useCallback(() => isMounted.current, [])
  };
}
