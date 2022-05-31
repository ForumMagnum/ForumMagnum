import React from 'react';
import { JssProvider } from 'react-jss';
import {  jssPreset, createGenerateClassName } from '@material-ui/core/styles';
import { create } from 'jss';
import { getForumTheme } from '../themes/forumTheme';
import type { ThemeOptions } from '../themes/themeNames';
import { ThemeContextProvider } from '../components/themes/useTheme';


export function wrapWithMuiTheme (app: React.ReactNode, themeOptions: ThemeOptions) {
  const generateClassName = createGenerateClassName();
  const jss = create({
    ...jssPreset(),
    insertionPoint: document.getElementById("jss-insertion-point") as HTMLElement,
  });
  
  return (
    <JssProvider jss={jss} generateId={generateClassName}>
      <ThemeContextProvider options={themeOptions}>
        {app}
      </ThemeContextProvider>
    </JssProvider>
  );
}
