import { useEffect, useState } from "react";
import { isClient } from "../../lib/executionEnvironment";
import { useTheme } from "../themes/useTheme";

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes your on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useIsAboveScreenWidth = (targetScreenWidth: number) => {
  if (!isClient) {
    return true;
  }
  const initialScreenWidth = window.innerWidth;
  const [actualScreenWidth, setActualScreenWidth] = useState(initialScreenWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setActualScreenWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [])
  
  return actualScreenWidth > targetScreenWidth;
}

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes your on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useIsAboveBreakpoint = (breakpoint: BreakpointName) => {
  const theme = useTheme();
  const breakpointWidth = theme.breakpoints.values[breakpoint];
  return useIsAboveScreenWidth(breakpointWidth);
}

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes your on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useIsDesktop = () => {
  return useIsAboveBreakpoint('lg');
}

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes your on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useIsMobile = () => {
  return !useIsAboveBreakpoint('sm');
}
