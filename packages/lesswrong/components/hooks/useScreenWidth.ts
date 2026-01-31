import { useSyncExternalStore } from "react";
import { useTheme } from "../themes/useTheme";

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

/**
 * Returns whether the screen width is above (>=) a threshold, in pixels. On
 * first render and during SSR, returns `defaultValue` (which is then changed
 * to the correct value, if it's different, in a useLayoutEffect). So if the
 * screen dimension doesn't match the default, this will cause a double render.
 */
export const useIsAboveScreenWidth = (targetScreenWidth: number, defaultValue=true) => {
  return useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth >= targetScreenWidth,
    () => defaultValue,
  );
}

/**
 * Returns whether the screen width is above (>=) a named breakpoint. On first
 * render and during SSR, returns `defaultValue` (which is then changed to the
 * correct value, if it's different, in a useLayoutEffect).
 */
export const useIsAboveBreakpoint = (breakpoint: BreakpointName, defaultValue=true) => {
  const theme = useTheme();
  const breakpointWidth = theme.breakpoints.values[breakpoint];
  return useIsAboveScreenWidth(breakpointWidth, defaultValue);
}

/**
 * Get the window size. If server side or hydrating, returns 4000x2000. This
 * won't cause an SSR mismatch, but may cause visible layout shift.  We have a module-level
 * assignment to avoid returning a new object from getSnapshot even when the values
 * haven't changed, which would otherwise cause an infinite render loop and break.
 */
let cachedSize = { width: 4000, height: 2000 };

function getSnapshot() {
  if (cachedSize.width !== window.innerWidth || cachedSize.height !== window.innerHeight) {
    cachedSize = { width: window.innerWidth, height: window.innerHeight };
  }
  return cachedSize;
}

const SERVER_SNAPSHOT = { width: 4000, height: 2000 };

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export const useWindowSize = () => {
  return useSyncExternalStore(
    subscribeToResize,
    getSnapshot,
    getServerSnapshot
  );
}
