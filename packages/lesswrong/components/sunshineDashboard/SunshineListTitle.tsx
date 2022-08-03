import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    borderTop: theme.palette.border.normal,
    padding: 12,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }
})

const SunshineListTitle = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  return <Components.Typography variant="body2" className={classes.root}>
    { children }
  </Components.Typography>
};

const SunshineListTitleComponent = registerComponent('SunshineListTitle', SunshineListTitle, {styles});

declare global {
  interface ComponentTypes {
    SunshineListTitle: typeof SunshineListTitleComponent
  }
}

