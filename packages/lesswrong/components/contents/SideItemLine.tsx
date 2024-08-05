import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  sidebarInlineReactMobile: {
    display: "none",
    [theme.breakpoints.down('xs')]: {
      display: "block",
    },
  },
  sidebarInlineReactMobileLine: {
    width: 2,
    height: 24,
    position: "relative",
    left: 10,
  },
})

const SideItemLine = ({colorClass, classes}: {
  colorClass: string,
  classes: ClassesType,
}) => {
  return <span className={classes.sidebarInlineReactMobile}>
    <div className={classNames(classes.sidebarInlineReactMobileLine, colorClass)} />
  </span>
}

const SideItemLineComponent = registerComponent('SideItemLine', SideItemLine, {styles});

declare global {
  interface ComponentTypes {
    SideItemLine: typeof SideItemLineComponent
  }
}

