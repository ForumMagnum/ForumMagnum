import { EnvironmentOverrideContext } from "@/lib/utils/timeUtil";
import React, { ReactNode, useContext, useEffect, useState, useTransition } from "react";

export type DeferRenderTiming = "sync" | "async-blocking" | "async-non-blocking";

const DeferRender = ({
  noSSR = true,
  clientTiming = "async-non-blocking",
  fallback = null,
  children,
}: {
  noSSR?: boolean;
  /**
   * - sync: Render children on the first pass that this component is rendered,
   * except when noSSR blocks this (during SSR and on the very first hydration pass)
   * - async-blocking: Render children in a second pass after everything else has rendered,
   * as a regular priority render
   * - async-non-blocking: Render children in a second pass after everything else has rendered,
   * using useTransition to mark the render as low priority so the rest of the page remains interactive
   */
  clientTiming?: "sync" | "async-blocking" | "async-non-blocking";
  fallback?: ReactNode;
  children: ReactNode;
}) => {
  const [_isPending, startTransition] = useTransition();
  const [clientCanRender, setClientCanRender] = useState(clientTiming === "sync");
  const { matchSSR } = useContext(EnvironmentOverrideContext);

  const canRender = matchSSR ? !noSSR : clientCanRender;

  useEffect(() => {
    if (clientCanRender) return;

    if (clientTiming === "async-non-blocking") {
      startTransition(() => {
        setClientCanRender(true);
      });
    } else {
      setClientCanRender(true);
    }
  }, [clientCanRender, clientTiming]);

  if (!canRender) return <>{fallback}</>;

  return <>{children}</>;
};

export default DeferRender;
