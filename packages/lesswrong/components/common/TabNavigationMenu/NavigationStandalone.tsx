import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import TabNavigationMenu, { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { HOME_RHS_MAX_SCREEN_WIDTH } from '@/components/ea-forum/constants';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getCommunityPath } from '@/lib/pathConstants';

const ICON_ONLY_NAVIGATION_WIDTH = 64;
export const ICON_ONLY_NAVIGATION_BREAKPOINT = 1424;

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
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  sidebar: {
    width: TAB_NAVIGATION_MENU_WIDTH,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    ...(theme.isFriendlyUI && {
      top: 26,
    })
  },
  iconOnlySidebar: {
    [`@media (max-width: ${ICON_ONLY_NAVIGATION_BREAKPOINT}px)`]: {
      width: ICON_ONLY_NAVIGATION_WIDTH,
    },
  },
  iconOnlySidebarWrapper: {
    [`@media (max-width: ${ICON_ONLY_NAVIGATION_BREAKPOINT}px)`]: {
      minWidth: ICON_ONLY_NAVIGATION_WIDTH,
    },
  },
  navSidebarTransparent: {
    zIndex: 10,
  },
  background: {
    background: theme.palette.panelBackground.translucent3,
  },
  fullNavigation: {
    [`@media (max-width: ${ICON_ONLY_NAVIGATION_BREAKPOINT}px)`]: {
      display: "none",
    },
  },
  iconOnlyNavigation: {
    display: "none",
    [`@media (max-width: ${ICON_ONLY_NAVIGATION_BREAKPOINT}px)`]: {
      display: "block",
    },
  },
})

const NavigationStandalone = ({
  sidebarHidden,
  noTopMargin,
  iconOnlyNavigationEnabled,
  classes,
}: {
  sidebarHidden: boolean,
  noTopMargin?: boolean,
  iconOnlyNavigationEnabled?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { location } = useLocation();
  const friendlyUI = isFriendlyUI();

  const background = location.pathname === getCommunityPath();

  return <div className={classNames({
    [classes.sidebarWrapper]: friendlyUI,
    [classes.iconOnlySidebarWrapper]: friendlyUI && iconOnlyNavigationEnabled,
  })}>
    <Slide slidIn={!sidebarHidden}>
      <div className={classNames(classes.sidebar, {
        [classes.background]: background,
        [classes.iconOnlySidebar]: iconOnlyNavigationEnabled,
      })}>
        <div className={classes.fullNavigation}>
          <TabNavigationMenu
            iconOnlyNavigationEnabled={false}
            noTopMargin={noTopMargin}
          />
        </div>
        {iconOnlyNavigationEnabled && <div className={classes.iconOnlyNavigation}>
          <TabNavigationMenu
            iconOnlyNavigationEnabled={iconOnlyNavigationEnabled}
            noTopMargin={noTopMargin}
          />
        </div>}
      </div>
    </Slide>
  </div>
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


