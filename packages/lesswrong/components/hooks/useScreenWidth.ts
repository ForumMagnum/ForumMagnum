import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { isClient } from "../../lib/executionEnvironment";
import { useTheme } from "../themes/useTheme";

/**
 * Returns whether the screen width is above (>=) a threshold, in pixels. On
 * first render and during SSR, returns `defaultValue` (which is then changed
 * to the correct value, if it's different, in a useLayoutEffect). So if the
 * screen dimension doesn't match the default, this will cause a double render.
 */
export const useIsAboveScreenWidth = (targetScreenWidth: number, defaultValue=true) => {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => {
        window.removeEventListener("resize", cb);
      };
    },
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
 * won't cause an SSR mismatch, but may cause visible layout shift.
 */
export const useWindowSize = () => {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => {
        window.removeEventListener("resize", cb);
      };
    },
    () => ({width: window.innerWidth, height: window.innerHeight}),
    () => ({width: 4000, height: 2000}),
  );
}
