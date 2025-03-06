import React from 'react';

// Simple theme provider replacement
export const MuiThemeProvider: React.FC<{theme?: any; children: React.ReactNode}> = ({children}) => {
  return <>{children}</>;
};

// Simple withStyles HOC replacement
export const withStyles = (styles: any) => (Component: any) => {
  return (props: any) => <Component {...props} />;
};

// Simple withTheme HOC replacement
export const withTheme = (Component: any) => {
  return (props: any) => <Component {...props} theme={{}} />;
};

// Simple createMuiTheme replacement
export const createMuiTheme = (options: any) => {
  return options;
};

// Simple createGenerateClassName replacement
export const createGenerateClassName = () => {
  return (rule: any, sheet: any) => `mui-${rule.key}`;
};

// Simple jssPreset replacement
export const jssPreset = () => ({});

// Simple createStyles replacement
export const createStyles = (styles: any) => styles; 