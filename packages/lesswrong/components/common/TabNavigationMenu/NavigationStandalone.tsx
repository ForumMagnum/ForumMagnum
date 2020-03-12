import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Slide from '@material-ui/core/Slide'

const styles = theme => ({
  root: {
    position: "absolute",
    zIndex: theme.zIndexes.tabNavigation,
  },
  sidebar: {
    position: "absolute",
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
    top: 0,
    left:0,
    paddingTop: 15,
    backgroundColor: "#ffffffd4",
  },
  footerBar: {
    [theme.breakpoints.up('lg')]: {
      display: "none"
    },
    position: "fixed",
    bottom: 0,
    left: 0,
    backgroundColor: theme.palette.grey[300],
    width: "100%",
  },
  "@media print": {
    display: "none"
  }
})

const NavigationStandalone = ({sidebarHidden, classes}) => {
  const { TabNavigationMenu, TabNavigationMenuFooter } = Components
  return <div className={classes.root}>
    <div className={classes.sidebar}>
      <Slide
        direction='right'
        in={!sidebarHidden}
        appear={false}
        mountOnEnter
        unmountOnExit
      >
        <TabNavigationMenu />
      </Slide>
    </div>
    <div className={classes.footerBar}>
      <TabNavigationMenuFooter />
    </div>
  </div>
}

const NavigationStandaloneComponent = registerComponent(
  'NavigationStandalone', NavigationStandalone, {styles}
);

declare global {
  interface ComponentTypes {
    NavigationStandalone: typeof NavigationStandaloneComponent
  }
}
