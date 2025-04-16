import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import Slide from '@/lib/vendor/@material-ui/core/src/Slide'
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { communityPath } from '../../../lib/routes';
import { isLWorAF } from '../../../lib/instanceSettings';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { HOME_RHS_MAX_SCREEN_WIDTH } from '../../ea-forum/EAHomeRightHandSide';
import { componentWithChildren } from '../../../lib/utils/componentsWithChildren';

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
  const { TabNavigationMenu } = Components
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

const NavigationStandaloneComponent = registerComponent(
  'NavigationStandalone', NavigationStandalone, {styles}
);

declare global {
  interface ComponentTypes {
    NavigationStandalone: typeof NavigationStandaloneComponent
  }
}
