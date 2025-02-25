import React, { useMemo, useState } from "react";
import { useTheme } from "../themes/useTheme";
import type { StyleDefinition } from "@/server/styleGeneration";
import { setClientMountedStyles, StylesContext, StylesContextType } from "./useStyles";
import { isClient } from "@/lib/executionEnvironment";

export const FMJssProvider = ({children}: {
  children: React.ReactNode
}) => {
  const theme = useTheme();
  const [mountedStyles] = useState(() => new Map<string, {
    refcount: number
    styleDefinition: StyleDefinition,
    styleNode: HTMLStyleElement
  }>());
  const jssState = useMemo<StylesContextType>(() => ({
    theme, mountedStyles: mountedStyles
  }), [theme, mountedStyles]);
  
  if (isClient) {
    setClientMountedStyles(jssState);
  }
  
  return <StylesContext.Provider value={jssState}>
    {children}
  </StylesContext.Provider>
}

