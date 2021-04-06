import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position:"sticky",
    zIndex: theme.zIndexes.sidebarHoverOver,
  },
  hoverInfo: {
    position: "sticky",
    backgroundColor: theme.palette.grey[50],
    padding: theme.spacing.unit*2,
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "-3px 0 5px 0px rgba(0,0,0,.1)",
    overflow: "hidden",
  }
})

const SidebarHoverOver = ({children, classes, hover, anchorEl, width=500}: {
  children: React.ReactNode,
  classes: ClassesType,
  hover: boolean,
  anchorEl: HTMLElement|null,
  width?: number,
}) => {
  const { LWPopper } = Components;
  return <LWPopper className={classes.root} open={hover} anchorEl={anchorEl} placement="left-start">
    <div className={classes.hoverInfo} style={{width:width}}>
      { children }
    </div>
  </LWPopper>
};

const SidebarHoverOverComponent = registerComponent('SidebarHoverOver', SidebarHoverOver, {styles});

declare global {
  interface ComponentTypes {
    SidebarHoverOver: typeof SidebarHoverOverComponent
  }
}

