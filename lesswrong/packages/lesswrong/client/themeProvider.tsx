import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { create } from 'jss';
import type { AbstractThemeOptions } from '../themes/themeNames';
import { ThemeContextProvider } from '../components/themes/useTheme';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';
import { createGenerateClassName, jssPreset } from "@/components/mui-replacement";

export function wrapWithMuiTheme (app: React.ReactNode, themeOptions: AbstractThemeOptions) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  const jss = create({
    ...jssPreset(),
    insertionPoint: document.getElementById("jss-insertion-point") as HTMLElement,
  });

  return (
    <JssProvider jss={jss} generateClassName={generateClassName}>
    <ThemeContextProvider options={themeOptions}>
      <FMJssProvider>
        {app}
      </FMJssProvider>
    </ThemeContextProvider>
    </JssProvider>
  );
}
