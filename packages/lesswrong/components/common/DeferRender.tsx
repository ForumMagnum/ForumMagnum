import { isMobile } from "@/lib/utils/isMobile";
import { EnvironmentOverrideContext } from "@/lib/utils/timeUtil";
import React, { ReactNode, useContext, useEffect, useState, useTransition } from "react";

const DeferRender = ({
  ssr,
  clientTiming = "sync",
  fallback = null,
  children,
}: {
  /**
   * Whether to render the children during SSR. This is always respected and overrides `clientTiming`
   */
  ssr: boolean;
  /**
   * - sync: Render children on the first pass that this component is rendered,
   * except when `ssr` overrides this (during SSR and on the very first hydration pass)
   * - async-blocking: Render children in a second pass after everything else has rendered,
   * as a regular priority render
   * - async-non-blocking: Render children in a second pass after everything else has rendered,
   * using useTransition to mark the render as low priority so the rest of the page remains interactive
   * - mobile-aware: Use "sync" on desktop and "async-non-blocking" on mobile. This may be best in a lot of
   * cases because:
   *   1. Using async for down-screen elements is more likely to cause layout shift on desktop
   *   2. Resources are more limited on mobile so "async-non-blocking" helps more with interactivity
   */
  clientTiming?: "sync" | "async-blocking" | "async-non-blocking" | "mobile-aware";
  fallback?: ReactNode;
  children: ReactNode;
}) => {
  // Note: it's ok to use isMobile() here (in a possibly-server context) because matchSSR will override it
  // if this is running on the server
  const mobileAwareTiming =
    clientTiming === "mobile-aware" ? (isMobile() ? "async-non-blocking" : "sync") : clientTiming;

  const [_isPending, startTransition] = useTransition();
  const { matchSSR } = useContext(EnvironmentOverrideContext);
  const [canRender, setClientCanRender] = useState(matchSSR ? ssr : mobileAwareTiming === "sync");

  useEffect(() => {
    if (canRender) return;

    if (mobileAwareTiming === "async-non-blocking") {
      startTransition(() => {
        setClientCanRender(true);
      });
    } else {
      setClientCanRender(true);
    }
  }, [canRender, mobileAwareTiming]);

  if (!canRender) return <>{fallback}</>;

  return <>{children}</>;
};

export default DeferRender;
