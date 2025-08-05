'use client';

import type { AbstractThemeOptions, ThemeOptions } from '@/themes/themeNames';
import React from 'react';

export type ThemeContextType = {
  theme: ThemeType,
  abstractThemeOptions: AbstractThemeOptions,
  concreteThemeOptions: ThemeOptions,
  setThemeOptions: (options: AbstractThemeOptions) => void
}

export const ThemeContext = React.createContext<ThemeContextType | null>(null);
