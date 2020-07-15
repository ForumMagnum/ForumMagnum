import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName, jssPreset } from '@material-ui/core/styles';
import { create } from 'jss';
import forumTheme from '../themes/forumTheme';
import JssCleanup from '../components/themes/JssCleanup';


export function wrapWithMuiTheme (app) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  const jss = create({
    ...jssPreset(),
    insertionPoint: document.getElementById("jss-insertion-point") as HTMLElement,
  });
  
  return (
    <JssProvider jss={jss} generateClassName={generateClassName}>
      <MuiThemeProvider theme={forumTheme}>
        {app}
        <JssCleanup />
      </MuiThemeProvider>
    </JssProvider>
  );
}
