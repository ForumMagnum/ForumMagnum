"use client";
import { ReactNode, Fragment, useEffect } from "react";

const componentKey = { val: 0 };
export function ResetStateOnUnmount({enabled, children}: {
  enabled: boolean
  children: ReactNode
}) {
  useEffect(() => {
    return () => {
      if (enabled) {
        componentKey.val++;
      }
    };
  }, [enabled]);
  return <Fragment key={componentKey.val}>{children}</Fragment>;
}
