import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SidebarActionMenu', (theme: ThemeType) => ({
  root: {
    position: "absolute",
    top:0,
    right:0,
    height: "100%",
    display:"flex",
    alignItems: "center",
    backgroundColor: theme.palette.grey[50],
    paddingLeft: 16,
    zIndex: theme.zIndexes.sidebarActionMenu,
  },
}))

const SidebarActionMenu = ({children}: {
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
    {children}
  </div>
};

export default registerComponent('SidebarActionMenu', SidebarActionMenu, {styles});



