import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import LWPopper from "@/components/common/LWPopper";

const styles = (theme: ThemeType) => ({
  root: {
    position:"relative",
    zIndex: theme.zIndexes.sidebarHoverOver,
  },
  hoverInfo: {
    position: "relative",
    backgroundColor: theme.palette.grey[50],
    padding: theme.spacing.unit*2,
    border: theme.palette.border.faint,
    boxShadow: theme.palette.boxShadow.sunshineSidebarHoverInfo,
    overflow: "hidden",
  }
})

const SidebarHoverOver = ({children, classes, hover, anchorEl, width=500}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  hover: boolean,
  anchorEl: HTMLElement|null,
  width?: number,
}) => {
  return <LWPopper className={classes.root} open={hover} anchorEl={anchorEl} placement="left-start" allowOverflow>
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

export default SidebarHoverOverComponent;

