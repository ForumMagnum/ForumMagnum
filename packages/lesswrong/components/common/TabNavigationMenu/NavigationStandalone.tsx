import React from 'react';
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import TabNavigationMenu, { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getCommunityPath } from '@/lib/pathConstants';

const ICON_ONLY_NAVIGATION_WIDTH = 64;
export const ICON_ONLY_NAVIGATION_BREAKPOINT = 1424;

// Stable class name used in the @global headroom selector below
const NAV_SIDEBAR_STICKY_CLASS = 'NavigationStandalone-sticky';

const styles = defineStyles("NavigationStandalone", (theme: ThemeType) => ({
  sidebar: {
    width: TAB_NAVIGATION_MENU_WIDTH,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  iconOnlySidebar: {
    [`@media (max-width: ${ICON_ONLY_NAVIGATION_BREAKPOINT}px)`]: {
      width: ICON_ONLY_NAVIGATION_WIDTH,
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
  stickyContainer: {
    position: 'sticky',
    top: 0,
    alignSelf: 'start',
    transition: 'top 0.2s ease-in-out',
  },
  '@global': {
    // When the header is visible (pinned = scrolling up, unfixed = at page top),
    // keep the nav flush below it; when the header is hidden (unpinned), top stays 0.
    [`body:has(.headroom--pinned) .${NAV_SIDEBAR_STICKY_CLASS},
      body:has(.headroom--unfixed) .${NAV_SIDEBAR_STICKY_CLASS}`]: {
      top: 'var(--header-height)',
    },
  },
}))

const NavigationStandalone = ({ sidebarHidden, iconOnlyNavigationEnabled }: {
  sidebarHidden: boolean,
  iconOnlyNavigationEnabled?: boolean,
}) => {
  const classes = useStyles(styles);
  const { location } = useLocation();

  const background = location.pathname === getCommunityPath();

  return <div className={classNames(classes.stickyContainer, NAV_SIDEBAR_STICKY_CLASS)}>
    <Slide slidIn={!sidebarHidden}>
      <div className={classNames(classes.sidebar, {
        [classes.background]: background,
        [classes.iconOnlySidebar]: iconOnlyNavigationEnabled,
      })}>
        <div className={classes.fullNavigation}>
          <TabNavigationMenu
            iconOnlyNavigationEnabled={false}
          />
        </div>
        {iconOnlyNavigationEnabled && <div className={classes.iconOnlyNavigation}>
          <TabNavigationMenu
            iconOnlyNavigationEnabled={iconOnlyNavigationEnabled}
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

export default NavigationStandalone;


