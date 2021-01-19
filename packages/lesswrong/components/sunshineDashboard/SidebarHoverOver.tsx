import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Popper from '@material-ui/core/Popper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position:"relative",
    zIndex: theme.zIndexes.sidebarHoverOver,
  },
  hoverInfo: {
    position: "relative",
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
  return <Popper className={classes.root} open={hover} anchorEl={anchorEl} placement="left-start">
    <div className={classes.hoverInfo} style={{width:width}}>
      { children }
    </div>
  </Popper>
};

const SidebarHoverOverComponent = registerComponent('SidebarHoverOver', SidebarHoverOver, {styles});

declare global {
  interface ComponentTypes {
    SidebarHoverOver: typeof SidebarHoverOverComponent
  }
}

