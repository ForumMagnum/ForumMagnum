import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { default as BadlyTypedSlide } from '@material-ui/core/Slide'
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { communityPath } from '../../../lib/routes';
import { isLWorAF } from '../../../lib/instanceSettings';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { HOME_RHS_MAX_SCREEN_WIDTH } from '../../ea-forum/EAHomeRightHandSide';
import { componentWithChildren } from '../../../lib/utils/componentsWithChildren';

const Slide = componentWithChildren(BadlyTypedSlide);

const styles = (theme: ThemeType): JssStyles => ({
  // This wrapper is on friendly sites so that when this sidebar is hidden
  // and the right-hand sidebar is visible,
  // the center column is positioned slightly closer to the center of the screen.
  sidebarWrapper: {
    minWidth: 100,
    zIndex: theme.zIndexes.footerNav,
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
  },
  navSidebarTransparent: {
    zIndex: 10,
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
    zIndex: theme.zIndexes.footerNav
  },
  "@media print": {
    display: "none"
  },
  background: {
    background: theme.palette.panelBackground.translucent3,
  }
})

const NavigationStandalone = ({
  sidebarHidden,
  unspacedGridLayout,
  noTopMargin,
  className,
  classes,
}: {
  sidebarHidden: boolean,
  unspacedGridLayout?: boolean,
  noTopMargin?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const { TabNavigationMenu, TabNavigationMenuFooter } = Components
  const { location } = useLocation();

  const background = location.pathname === communityPath;

  return <>
    <div className={classNames({[classes.sidebarWrapper]: isFriendlyUI})}>
      <Slide
        direction='right'
        in={!sidebarHidden}
        appear={false}
        mountOnEnter
        unmountOnExit
      >
        <div className={classNames(classes.sidebar, className, {[classes.background]: background, [classes.navSidebarTransparent]: unspacedGridLayout})}>
          {/* In the unspaced grid layout the sidebar can appear on top of other componenents, so make the background transparent */}
          <TabNavigationMenu
            transparentBackground={unspacedGridLayout}
            noTopMargin={noTopMargin}
          />
        </div>
      </Slide>
    </div>
    {isLWorAF && <div className={classNames(classes.footerBar, className)}>
      <TabNavigationMenuFooter />
    </div>}
  </>
}

const NavigationStandaloneComponent = registerComponent(
  'NavigationStandalone', NavigationStandalone, {styles}
);

declare global {
  interface ComponentTypes {
    NavigationStandalone: typeof NavigationStandaloneComponent
  }
}
