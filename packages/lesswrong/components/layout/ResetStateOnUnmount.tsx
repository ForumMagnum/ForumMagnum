"use client";
import { ReactNode, Fragment, useEffect, useRef } from "react";

export function ResetStateOnUnmount({enabled, children}: {
  enabled: boolean
  children: ReactNode
}) {
  const componentKey = useRef(0);
  useEffect(() => {
    return () => {
      if (enabled) {
        componentKey.current++;
      }
    };
  }, [enabled]);
  return <Fragment key={componentKey.current}>{children}</Fragment>;
}
