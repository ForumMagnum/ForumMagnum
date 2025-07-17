import React, { useState } from "react";
import { useTheme, useThemeOptions } from "../themes/useTheme";
import { createStylesContext, setClientMountedStyles, StylesContext, StylesContextType } from "./useStyles";
import { isClient } from "@/lib/executionEnvironment";

export const FMJssProvider = ({stylesContext, children}: {
  stylesContext?: StylesContextType
  children: React.ReactNode
}) => {
  const theme = useTheme();
  const themeOptions = useThemeOptions();
  const [jssState] = useState(() => stylesContext ?? createStylesContext(theme, themeOptions));
  
  if (isClient) {
    setClientMountedStyles(jssState);
  }
  
  return <StylesContext.Provider value={jssState}>
    {children}
  </StylesContext.Provider>
}

