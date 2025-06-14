'use client';

import React, { useState } from "react";
import { useTheme } from "../themes/useTheme";
import { StylesContext, StylesContextType } from "./useStyles";
import { setClientMountedStyles } from "@/lib/styles/defineStyles";
import { createStylesContext } from "@/lib/jssStyles";
import { isClient } from "@/lib/executionEnvironment";

export const FMJssProvider = ({stylesContext, children}: {
  stylesContext?: StylesContextType
  children: React.ReactNode
}) => {
  const theme = useTheme();
  const [jssState] = useState(() => stylesContext ?? createStylesContext(theme));
  
  if (isClient) {
    setClientMountedStyles(jssState);
  }
  
  return <StylesContext.Provider value={jssState}>
    {children}
  </StylesContext.Provider>
}

