import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName, jssPreset } from '@material-ui/core/styles';
import { create } from 'jss';
import { getForumTheme } from '../themes/forumTheme';
import JssCleanup from '../components/themes/JssCleanup';
import type { ThemeOptions } from '../themes/themeNames';


export function wrapWithMuiTheme (app: React.ReactNode, theme: ThemeOptions) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  const jss = create({
    ...jssPreset(),
    insertionPoint: document.getElementById("jss-insertion-point") as HTMLElement,
  });
  
  return (
    <JssProvider jss={jss} generateClassName={generateClassName}>
      <MuiThemeProvider theme={getForumTheme(theme)}>
        {app}
        <JssCleanup />
      </MuiThemeProvider>
    </JssProvider>
  );
}
