import React, { useMemo, useRef, useState } from "react";
import { useTheme } from "../themes/useTheme";
import type { StyleDefinition } from "@/server/styleGeneration";
import { setClientMountedStyles, styleNodeToString, StylesContext, StylesContextType } from "./useStyles";
import { isClient } from "@/lib/executionEnvironment";
import { useServerInsertedHTML } from "next/navigation";

type StyleRegistry = {
  [key: string]: {
    styleDefinition: StyleDefinition,
  }
}

export const FMJssProvider = ({children}: {
  children: React.ReactNode
}) => {
  const theme = useTheme();
  const [mountedStyles] = useState(() => new Map<string, {
    refcount: number
    styleDefinition: StyleDefinition,
    styleNode: HTMLStyleElement
  }>());

  const styleRegistry = useRef<StyleRegistry>({});


  const jssState = useMemo<StylesContextType>(() => ({
    theme, mountedStyles: mountedStyles, addStyle: (style: StyleDefinition) => {
      styleRegistry.current[style.name] = {
        styleDefinition: style,
      }
    }
  }), [theme, mountedStyles]);
  
  if (isClient) {
    setClientMountedStyles(jssState);
  }

  useServerInsertedHTML(() => {
    const styles = Object.values(styleRegistry.current).reverse().map(({styleDefinition}) => styleNodeToString(theme, styleDefinition)).join("\n");
    return <style>{styles}</style>
  })
  
  return <StylesContext.Provider value={jssState}>
    <style></style>
    {children}
  </StylesContext.Provider>
}

