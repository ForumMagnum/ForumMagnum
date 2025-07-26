import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import TabNavigationMenu, { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { HOME_RHS_MAX_SCREEN_WIDTH } from '@/components/ea-forum/constants';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { communityPath } from '@/lib/pathConstants';

const styles = (theme: ThemeType) => ({
  // This wrapper is on friendly sites so that when this sidebar is hidden
  // and the right-hand sidebar is visible,
  // the center column is positioned slightly closer to the center of the screen.
  sidebarWrapper: {
    minWidth: 100,
    zIndex: theme.zIndexes.footerNav,
    "@media print": {
      display: "none"
    },
    [`@media(max-width: ${HOME_RHS_MAX_SCREEN_WIDTH}px)`]: {
      minWidth: 0,
    },
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
  },
  sidebar: {
    width: TAB_NAVIGATION_MENU_WIDTH,
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
    ...(isFriendlyUI && {
      top: 26,
    })
  },
  navSidebarTransparent: {
    zIndex: 10,
  },
  background: {
    background: theme.palette.panelBackground.translucent3,
  }
})

const NavigationStandalone = ({
  sidebarHidden,
  unspacedGridLayout,
  noTopMargin,
  classes,
}: {
  sidebarHidden: boolean,
  unspacedGridLayout?: boolean,
  noTopMargin?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { location } = useLocation();

  const background = location.pathname === communityPath;

  return <>
    <div className={classNames({[classes.sidebarWrapper]: isFriendlyUI})}>
      <Slide slidIn={!sidebarHidden}>
        <div className={classNames(classes.sidebar, {[classes.background]: background, [classes.navSidebarTransparent]: unspacedGridLayout})}>
          {/* In the unspaced grid layout the sidebar can appear on top of other componenents, so make the background transparent */}
          <TabNavigationMenu
            transparentBackground={unspacedGridLayout}
            noTopMargin={noTopMargin}
          />
        </div>
      </Slide>
    </div>
  </>
}

const slideStyles = defineStyles("Slide", (theme: ThemeType) => ({
  wrapper: {
    position: "relative",
  },
  slider: {
    transition: "left 0.3s ease-in-out",
    position: "relative",
  },
  slidOut: {
    left: "-100%",
  },
  slidIn: {
    left: 0,
  },
}));

const Slide = ({slidIn, children}: {
  slidIn: boolean,
  children: React.ReactNode
}) => {
  const classes = useStyles(slideStyles);
  return <div className={classes.wrapper}>
    <div className={classNames(classes.slider, {
      [classes.slidOut]: !slidIn,
      [classes.slidIn]: slidIn,
    })}>
      {children}
    </div>
  </div>
}

export default registerComponent(
  'NavigationStandalone', NavigationStandalone, {styles}
);


