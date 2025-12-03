import { useEffect, useLayoutEffect, useState } from "react";
import { isClient } from "../../lib/executionEnvironment";
import { useTheme } from "../themes/useTheme";

/**
 * Returns whether the screen width is above (>=) a threshold, in pixels. On
 * first render and during SSR, returns `defaultValue` (which is then changed
 * to the correct value, if it's different, in a useLayoutEffect). So if the
 * screen dimension doesn't match the default, this will cause a double render.
 */
export const useIsAboveScreenWidth = (targetScreenWidth: number, defaultValue=true) => {
  const [isAbove, setIsAbove] = useState(defaultValue);
  
  useLayoutEffect(() => {
    const checkSize = () => setIsAbove(window.innerWidth >= targetScreenWidth);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [targetScreenWidth])
  
  return isAbove;
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
 * WARNING: This hook is not SSR safe!
 *
 * It assumes you're on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useWindowSize = () => {
  const [size, setSize] = useState<{width: number, height: number}>(
    isClient
      ? {width: window.innerWidth, height: window.innerHeight}
      : {width: 4000, height: 2000}
  );

  useEffect(() => {
    const handleResize = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [])

  return size;
}
