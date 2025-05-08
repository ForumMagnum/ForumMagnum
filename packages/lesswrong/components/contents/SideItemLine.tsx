import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  sidebarInlineReactMobile: {
    display: "none",
    [theme.breakpoints.down('xs')]: {
      display: "block",
    },
  },
  sidebarInlineReactMobileLine: {
    width: 4,
    height: 24,
    position: "relative",
    left: 9,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
})

const SideItemLineInner = ({colorClass, classes}: {
  colorClass: string,
  classes: ClassesType<typeof styles>,
}) => {
  return <span className={classes.sidebarInlineReactMobile}>
    <div className={classNames(classes.sidebarInlineReactMobileLine, colorClass)} />
  </span>
}

export const SideItemLine = registerComponent('SideItemLine', SideItemLineInner, {styles});

declare global {
  interface ComponentTypes {
    SideItemLine: typeof SideItemLine
  }
}

