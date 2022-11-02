import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { jssPreset } from '@material-ui/core/styles';
import { create } from 'jss';
import type { AbstractThemeOptions } from '../themes/themeNames';
import { ThemeContextProvider } from '../components/themes/useTheme';
import { generateClassName } from '../lib/utils/generateClassName';

export function wrapWithMuiTheme (app: React.ReactNode, themeOptions: AbstractThemeOptions) {
  const jss = create({
    ...jssPreset(),
    insertionPoint: document.getElementById("jss-insertion-point") as HTMLElement,
  });

  return (
    <JssProvider jss={jss} generateClassName={generateClassName}>
      <ThemeContextProvider options={themeOptions}>
        {app}
      </ThemeContextProvider>
    </JssProvider>
  );
}
