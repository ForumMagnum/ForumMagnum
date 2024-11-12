import type { StyleDefinition } from '@/server/styleGeneration';
import React, { createContext, useMemo, useState } from 'react';
import { useTheme } from '../themes/useTheme';
import { StylesContext, StylesContextType } from './useStyles';

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
  return <StylesContext.Provider value={jssState}>
    {children}
  </StylesContext.Provider>
}
