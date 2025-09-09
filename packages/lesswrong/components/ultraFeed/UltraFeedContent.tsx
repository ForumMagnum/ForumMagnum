import React, { useState, useRef } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { randomId } from '@/lib/random';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { ObservableQuery } from '@apollo/client';
import { UltraFeedQuery } from '../common/feeds/feedQueries';
import ForumIcon from '../common/ForumIcon';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import FeedItemWrapper from './FeedItemWrapper';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import UltraFeedPostItem from './UltraFeedPostItem';
import UltraFeedQuickTakeDialog from './UltraFeedQuickTakeDialog';
import UltraFeedSettings from './UltraFeedSettings';
import UltraFeedThreadItem from './UltraFeedThreadItem';
import UltraFeedSpotlightItem from './UltraFeedSpotlightItem';
import AnalyticsInViewTracker from '../common/AnalyticsInViewTracker';
import useUltraFeedSettings from '../hooks/useUltraFeedSettings';
import type { FeedItemSourceType } from './ultraFeedTypes';
import SuggestedFeedSubscriptions from '../subscriptions/SuggestedFeedSubscriptions';

const styles = defineStyles("UltraFeedContent", (theme: ThemeType) => ({
  root: {
  },
  feedComementItem: {
    marginBottom: 16
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  feedCheckboxAndSettingsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  settingsButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  ultraFeedNewContentContainer: {
    position: 'relative',
    width: '100%',
  },
  returnToTopBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  returnToTopLink: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    cursor: 'pointer',
    textAlign: 'center',
  },
  tabsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    marginLeft: 24,
    marginRight: 24,
    flex: '1 1 auto',
    paddingBottom: 0,
  },
  tabButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 600,
    padding: '20px 12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s',
    flex: 1,
    '&:hover': {
      backgroundColor: theme.palette.background.hover,
    },
  },
  tabButtonInactive: {
    color: theme.palette.grey[500],
  },
  tabButtonActive: {
    color: theme.palette.text.primary,
  },
  tabLabel: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -16,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px 3px 0 0',
  },
  settingsContainer: {
    marginBottom: 16,
  },
  settingsContainerExternal: {
    marginTop: 16,
    marginBottom: 32,
  },
  composerButton: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      position: 'fixed',
      bottom: 18,
      right: 18,
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme.palette.boxShadow.default,
      cursor: 'pointer',
      zIndex: theme.zIndexes.intercomButton,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
    },
  },
  composerIcon: {
    fontSize: 24,
  },
  disabledMessage: {
    textAlign: 'center',
    padding: 40,
    ...theme.typography.body1,
    color: theme.palette.text.dim,
  },
  titleLink: {
    color: 'inherit',
    '&:hover': {
      color: 'inherit',
      opacity: 0.8,
    },
  },
  refetchLoading: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: 'translateX(-50%) scale(2)',
    zIndex: 10,
  },

}));

const UltraFeedContent = ({
  settings,
  updateSettings,
  resetSettings,
  truncationMaps,
  settingsVisible,
  onCloseSettings,
  useExternalContainer,
  activeTab,
}: {
  settings: UltraFeedSettingsType,
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void,
  resetSettings: () => void,
  truncationMaps: { commentMap: Record<TruncationLevel, number>, postMap: Record<TruncationLevel, number> },
  alwaysShow?: boolean
  settingsVisible?: boolean
  onCloseSettings?: () => void
  useExternalContainer?: boolean
  activeTab: FeedType
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTopVisible, setIsTopVisible] = useState(true);
  const [isFeedInView, setIsFeedInView] = useState(false);

  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const [sessionId] = useState<string>(randomId);
  const refetchForYouRef = useRef<null | ObservableQuery['refetch']>(null);
  const refetchFollowingRef = useRef<null | (() => void)>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const forYouWrapperRef = useRef<HTMLDivElement | null>(null);
  const followingWrapperRef = useRef<HTMLDivElement | null>(null);
  const [hasRenderedForYou, setHasRenderedForYou] = useState(activeTab === 'ultraFeed');
  const [hasRenderedFollowing, setHasRenderedFollowing] = useState(activeTab === 'following');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOpenQuickTakeDialog = () => {
    captureEvent("ultraFeedComposerQuickTakeDialogOpened");
    openDialog({
      name: "UltraFeedQuickTakeDialog",
      contents: ({onClose}) => <UltraFeedQuickTakeDialog onClose={onClose} currentUser={currentUser} />
    });
  };

  useEffect(() => {
    const topEl = topSentinelRef.current;
    const containerEl = feedContainerRef.current;
    if (!topEl || !containerEl) return;

    const topObserver = new IntersectionObserver(([entry]) => {
      setIsTopVisible(entry.isIntersecting);
    }, { root: null, threshold: 0 });

    const presenceObserver = new IntersectionObserver(([entry]) => {
      setIsFeedInView(entry.isIntersecting);
    }, { root: null, threshold: 0 });

    topObserver.observe(topEl);
    presenceObserver.observe(containerEl);

    return () => {
      topObserver.disconnect();
      presenceObserver.disconnect();
    };
  }, []);

  // When switching to a tab for the first time, mark it as mounted
  useEffect(() => {
    if (activeTab === 'following' && !hasRenderedFollowing) {
      setHasRenderedFollowing(true);
    }
    if (activeTab === 'ultraFeed' && !hasRenderedForYou) {
      setHasRenderedForYou(true);
    }
  }, [activeTab, hasRenderedFollowing, hasRenderedForYou]);

  // Handle tab transitions
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleRefreshFeed = () => {
    const refetchFn = activeTab === 'ultraFeed' ? refetchForYouRef.current : refetchFollowingRef.current;
    if (refetchFn) {
      setIsRefreshing(true);
      void Promise.resolve(refetchFn()).finally(() => {
        setIsRefreshing(false);
      });
    }
  };

  if (!currentUser) {
    return null;
  }
  
  const resetSettingsToDefault = () => {
    resetSettings();
  };

  const { resolverSettings } = settings;

  return (
    <AnalyticsContext pageSectionContext="ultraFeed" ultraFeedContext={{ feedSessionId: sessionId }}>
      <AnalyticsInViewTracker eventProps={{inViewType: "ultraFeed"}}>
      <div className={classes.root} ref={feedContainerRef}>
        <UltraFeedObserverProvider incognitoMode={resolverSettings.incognitoMode}>
        <OverflowNavObserverProvider>
            <div ref={topSentinelRef} style={{ scrollMarginTop: 400 }} />
            
            {settingsVisible && (
              <div className={useExternalContainer ? classes.settingsContainerExternal : classes.settingsContainer}>
                {activeTab === 'ultraFeed' ? (
                  <UltraFeedSettings 
                    settings={settings}
                    updateSettings={updateSettings}
                    resetSettingsToDefault={resetSettingsToDefault}
                    onClose={() => onCloseSettings?.()} 
                    truncationMaps={truncationMaps}
                    showFeedSelector
                  />
                ) : (
                  <UltraFeedFollowingSettings
                    settings={settings}
                    updateSettings={updateSettings}
                    onClose={() => onCloseSettings?.()}
                  />
                )}
              </div>
            )}
            
            <div className={classes.ultraFeedNewContentContainer} style={isTransitioning ? { minHeight: FEED_MIN_HEIGHT } : undefined}>
              {isRefreshing && <div className={classes.refetchLoading}>
                <Loading />
              </div>}
              {hasRenderedForYou && (
                <div
                  ref={forYouWrapperRef}
                  style={activeTab === 'ultraFeed' ? undefined : { position: 'absolute', inset: 0, visibility: 'hidden', pointerEvents: 'none' }}
                >
                  <UltraFeedMainFeed
                    settings={settings}
                    sessionId={sessionId}
                    refetchRef={refetchForYouRef}
                    fetchPolicy="cache-first"
                    loadMoreDistanceProp={1000}
                    firstPageSize={15}
                    pageSize={30}
                  />
                </div>
              )}
              {hasRenderedFollowing && (
                <div
                  ref={followingWrapperRef}
                  style={activeTab === 'following' ? undefined : { position: 'absolute', inset: 0, visibility: 'hidden', pointerEvents: 'none' }}
                >
                  <UltraFeedContextProvider feedType="following">
                    <UltraFeedSubscriptionsFeed 
                      embedded={true} 
                      refetchRef={refetchFollowingRef}
                      settings={settings}
                      updateSettings={updateSettings}
                      showHideReadToggle={false}
                    />
                  </UltraFeedContextProvider>
                </div>
              )}
            </div>
        </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
        
        {userIsAdminOrMod(currentUser) && (
          <div className={classes.composerButton} onClick={handleOpenQuickTakeDialog}>
            <ForumIcon icon="Plus" className={classes.composerIcon} />
          </div>
        )}
      </div>
      </AnalyticsInViewTracker>
      {isFeedInView && (
        <UltraFeedBottomBar
          refetchFeed={handleRefreshFeed}
          isTopVisible={isTopVisible}
          feedRootEl={feedContainerRef.current} />
      )}
    </AnalyticsContext>
  );
};

export default UltraFeedContent;
