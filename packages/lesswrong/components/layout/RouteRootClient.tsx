"use client";
import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { DelayedLoading } from '../common/DelayedLoading';
import ErrorBoundary from '../common/ErrorBoundary';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { PopperPortalProvider } from '../common/LWPopper';

const styles = defineStyles("RouteRootClient", (theme: ThemeType) => ({
  main: {
    overflowX: 'clip',
    maxWidth: "100%",
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
  mainFullscreen: {
    height: "100%",
    padding: 0,
  },
}))

export const RouteRootClient = ({children, fullscreen}: {
  children: React.ReactNode
  fullscreen: boolean
}) => {
  const classes = useStyles(styles);

  return <PopperPortalProvider>
    <div className={classNames(classes.main, {
      [classes.mainFullscreen]: fullscreen,
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
  </PopperPortalProvider>
}

