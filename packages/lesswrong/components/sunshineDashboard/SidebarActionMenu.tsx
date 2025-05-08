import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    position: "absolute",
    top:0,
    right:0,
    height: "100%",
    display:"flex",
    alignItems: "center",
    backgroundColor: theme.palette.grey[50],
    paddingLeft: theme.spacing.unit*2,
    zIndex: theme.zIndexes.sidebarActionMenu,
  },
})

const SidebarActionMenuInner = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.root}>
    {children}
  </div>
};

export const SidebarActionMenu = registerComponent('SidebarActionMenu', SidebarActionMenuInner, {styles});

declare global {
  interface ComponentTypes {
    SidebarActionMenu: typeof SidebarActionMenu
  }
}

