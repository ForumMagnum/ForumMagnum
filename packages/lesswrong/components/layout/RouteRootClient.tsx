"use client";
import React, { use } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { DelayedLoading } from '../common/DelayedLoading';
import ErrorBoundary from '../common/ErrorBoundary';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { PopperPortalProvider } from '../common/LWPopper';
import { isFullscreenRoute, isHomeRoute, isRouteWithLeftNavigationColumn, isSunshineSidebarRoute } from '@/lib/routeChecks';
import DeferRender from '../common/DeferRender';
import NavigationStandalone from '../common/TabNavigationMenu/NavigationStandalone';
import { isLW, isLWorAF } from '@/lib/forumTypeUtils';
import { isFriendlyUI } from '@/themes/forumTheme';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { useCurrentUser } from '../common/withUser';
import { userCanDo } from '@/lib/vulcan-users/permissions';
import { MaybeStickyWrapper } from './MaybeStickyWrapper';
import dynamic from 'next/dynamic';
import { HideNavigationSidebarContext } from './HideNavigationSidebarContextProvider';

const SunshineSidebar = dynamic(() => import("../sunshineDashboard/SunshineSidebar"), { ssr: false });

const styles = defineStyles("RouteRootClient", (theme: ThemeType) => ({
  main: {
    overflowX: 'clip',
    maxWidth: "100%",
  },
  mainFullscreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  centralColumn: {
    paddingTop: theme.spacing.mainLayoutPaddingTop,
    marginLeft: "auto",
    marginRight: "auto",
    // Make sure the background extends to the bottom of the page, I'm sure there is a better way to do this
    // but almost all pages are bigger than this anyway so it's not that important
    minHeight: `calc(100vh - var(--header-height))`,
    gridArea: 'main',
    [theme.breakpoints.down('md')]: {
      paddingTop: theme.isFriendlyUI ? 0 : theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down('sm')]: {
      paddingTop: theme.isFriendlyUI ? 0 : 10,
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  fullscreen: {
    height: "100%",
    padding: 0,
  },
  rightSidebar: {
    gridArea: 'rightSidebar'
  },
}))

export const RouteRootClient = ({fullscreen, children}: {
  fullscreen: boolean
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  const pathname = usePrerenderablePathname();
  const standaloneNavigation = isRouteWithLeftNavigationColumn(pathname);
  const shouldUseGridLayout = standaloneNavigation;

  // an optional mode for displaying the side navigation, for when we want the right banner
  // to be displayed on medium screens
  const renderIconOnlyNavigation = isLW()
  const iconOnlyNavigationEnabled = renderIconOnlyNavigation && standaloneNavigation

  // The friendly home page has a unique grid layout, to account for the right hand side column.
  const friendlyHomeLayout = isFriendlyUI() && isHomeRoute(pathname);

  const currentUser = useCurrentUser();
  const renderSunshineSidebar = isSunshineSidebarRoute(pathname) && !!(userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins')) && !currentUser?.hideSunshineSidebar;
  
  const hideNavigationSidebar = !!use(HideNavigationSidebarContext)?.hideNavigationSidebar;

  const isFullscreen = isFullscreenRoute(pathname);

  return <PopperPortalProvider>
    <div className={classNames(classes.main, {[classes.mainFullscreen]: isFullscreen})}>
    <LeftAndRightSidebarsWrapper
      sidebarsEnabled={shouldUseGridLayout}
      fullscreen={isFullscreen}
      leftSidebar={
        standaloneNavigation && <SuspenseWrapper fallback={<span/>} name="NavigationStandalone" >
          <MaybeStickyWrapper sticky={friendlyHomeLayout}>
            <DeferRender ssr={true} clientTiming='mobile-aware'>
              <SuspenseWrapper name="NavigationStandalone">
                <NavigationStandalone
                  sidebarHidden={hideNavigationSidebar}
                  noTopMargin={friendlyHomeLayout}
                  iconOnlyNavigationEnabled={iconOnlyNavigationEnabled}
                />
              </SuspenseWrapper>
            </DeferRender>
          </MaybeStickyWrapper>
        </SuspenseWrapper>
      }
      rightSidebar={
        /* {!renderSunshineSidebar &&
          friendlyHomeLayout &&
          <MaybeStickyWrapper sticky={friendlyHomeLayout}>
            <DeferRender ssr={true} clientTiming='mobile-aware'>
              <SuspenseWrapper name="EAHomeRightHandSide">
                <EAHomeRightHandSide />
              </SuspenseWrapper>
            </DeferRender>
          </MaybeStickyWrapper>
        } */
        renderSunshineSidebar && <div className={classes.rightSidebar}>
          <DeferRender ssr={false}>
            <SuspenseWrapper name="SunshineSidebar">
              <SunshineSidebar/>
            </SuspenseWrapper>
          </DeferRender>
        </div>
      }
    >
      <div className={classNames(classes.centralColumn, {
        [classes.fullscreen]: fullscreen,
      })}>
        <ErrorBoundary>
          <SuspenseWrapper name="Route" fallback={<DelayedLoading/>}>
            {children}
          </SuspenseWrapper>
    
          {/* ea-forum-look-here We've commented out some EAForum-specific components for bundle size reasons */}
          {/* <SuspenseWrapper name="OnboardingFlow">
            {!isIncompletePath && isEAForum() ? <EAOnboardingFlow/> : <BasicOnboardingFlow/>}
          </SuspenseWrapper> */}
        </ErrorBoundary>
      </div>
    </LeftAndRightSidebarsWrapper>
  </div>
  </PopperPortalProvider>
}

const sidebarsWrapperStyles = defineStyles("LeftAndRightSidebarsWrapper", theme => ({
  spacedGridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar ... main imageGap rightSidebar"
      `,
      gridTemplateColumns: `
        minmax(0, min-content)
        minmax(0, 1fr)
        minmax(0, min-content)
        minmax(0, ${isLWorAF() ? 7 : 1}fr)
        minmax(0, min-content)
      `,
    },
  },
  gridBreakpointMd: {
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  gridBreakpointSm: {
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  fullscreenBodyWrapper: {
    flexBasis: 0,
    flexGrow: 1,
    overflow: "auto",
    [theme.breakpoints.down('xs')]: {
      overflow: "visible",
    },
  },
}));

function LeftAndRightSidebarsWrapper({sidebarsEnabled, fullscreen, leftSidebar, rightSidebar, children}: {
  sidebarsEnabled: boolean
  fullscreen: boolean
  leftSidebar: React.ReactNode
  rightSidebar: React.ReactNode
  children: React.ReactNode
}) {
  const classes = useStyles(sidebarsWrapperStyles);
  // ea-forum-look-here There used to be a column-sizing special case for the EA Forum front page here, which is no present.
  const navigationHasIconOnlyVersion = isLW();

  return <div className={classNames({
    [classes.spacedGridActivated]: sidebarsEnabled,
    [classes.gridBreakpointMd]: !navigationHasIconOnlyVersion && sidebarsEnabled,
    [classes.gridBreakpointSm]: navigationHasIconOnlyVersion && sidebarsEnabled,
    [classes.fullscreenBodyWrapper]: fullscreen,
  }
  )}>
    {leftSidebar}
    {children}
    {rightSidebar}
  </div>
}
