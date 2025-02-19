import { useEffect, useState } from "react";
import { isClient } from "../../lib/executionEnvironment";
import { useTheme } from "../themes/useTheme";

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes you're on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useIsAboveScreenWidth = (targetScreenWidth: number) => {
  const initialScreenWidth = isClient ? window.innerWidth : 4000;
  const [actualScreenWidth, setActualScreenWidth] = useState(initialScreenWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setActualScreenWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [])
  
  if (!isClient) {
    return true;
  }
  
  
  return actualScreenWidth > targetScreenWidth;
}

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes you're on the desktop and can cause layout shift on load for mobile
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
 * It assumes you're on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 *
 * NB: This is not the same as !useIsMobile(), because tablets exist.
 */
export const useIsDesktop = () => {
  return useIsAboveBreakpoint('lg');
}

/**
 * WARNING: This hook is not SSR safe!
 *
 * It assumes you're on the desktop and can cause layout shift on load for mobile
 * users if you're not careful.
 */
export const useIsMobile = () => {
  return !useIsAboveBreakpoint('sm');
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
