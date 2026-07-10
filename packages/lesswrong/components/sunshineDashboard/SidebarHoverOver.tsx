import React from 'react';
import LWPopper from "../common/LWPopper";
import type { HoverAnchor } from "../common/withHover";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SidebarHoverOver', (theme: ThemeType) => ({
  root: {
    position:"relative",
    zIndex: theme.zIndexes.sidebarHoverOver,
  },
  hoverInfo: {
    position: "relative",
    backgroundColor: theme.palette.grey[50],
    padding: 16,
    border: theme.palette.border.faint,
    boxShadow: theme.palette.boxShadow.sunshineSidebarHoverInfo,
    overflow: "hidden",
  }
}))

const SidebarHoverOver = ({children, hover, anchorEl, width=500}: {
  children: React.ReactNode,
  hover: boolean,
  anchorEl: HoverAnchor|null,
  width?: number,
}) => {
  const classes = useStyles(styles);

  return <LWPopper className={classes.root} open={hover} anchorEl={anchorEl} placement="left-start" allowOverflow>
    <div className={classes.hoverInfo} style={{width:width}}>
      { children }
    </div>
  </LWPopper>
};

export default SidebarHoverOver;



