import React, { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '../common/withUser';
import type { ObservableQuery } from '@apollo/client';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import UltraFeedHeader from './UltraFeedHeader';
import SingleColumnSection from "../common/SingleColumnSection";
import SettingsButton from "../icons/SettingsButton";
import InfoButton from "../icons/InfoButton";
import UltraFeedSettings from "./UltraFeedSettings";
import UltraFeedInfo from "./UltraFeedInfo";
import UltraFeedFollowingSettings from './UltraFeedFollowingSettings';
import ForumIcon from '../common/ForumIcon';
import UltraFeedQuickTakeDialog from './UltraFeedQuickTakeDialog';
import { useDialog } from '../common/withDialog';
import { ultraFeedEnabledSetting } from '@/lib/instanceSettings';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import type { UltraFeedSettingsType, TruncationLevel } from './ultraFeedSettingsTypes';
import AnalyticsInViewTracker from '../common/AnalyticsInViewTracker';
import Loading from '../vulcan-core/Loading';
import UltraFeedSubscriptionsFeed from './UltraFeedSubscriptionsFeed';
import UltraFeedMainFeed from './UltraFeedMainFeed';
import { UltraFeedContextProvider } from './UltraFeedContextProvider';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ACTIVE_TAB_COOKIE } from '../../lib/cookies/cookies';
import { FeedType } from './ultraFeedTypes';

const FEED_MIN_HEIGHT = 1500;

const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
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
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
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
  truncationMaps,
  settingsVisible,
  onCloseSettings,
  infoVisible,
  useExternalContainer,
  activeTab,
}: {
  settings: UltraFeedSettingsType,
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void,
  truncationMaps: { commentMap: Record<TruncationLevel, number>, postMap: Record<TruncationLevel, number> },
  alwaysShow?: boolean
  settingsVisible?: boolean
  onCloseSettings?: () => void
  infoVisible?: boolean
  useExternalContainer?: boolean
  activeTab: FeedType
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const [sessionId] = useState<string>(randomId);
  const refetchForYouRef = useRef<null | ObservableQuery['refetch']>(null);
  const refetchFollowingRef = useRef<null | (() => void)>(null);
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

  // When switching to a tab for the first time, mark it as mounted
  useEffect(() => {
    if (activeTab === 'following' && !hasRenderedFollowing) {
      setHasRenderedFollowing(true);
    }
    if (activeTab === 'ultraFeed' && !hasRenderedForYou) {
      setHasRenderedForYou(true);
    }
  }, [activeTab, hasRenderedFollowing, hasRenderedForYou]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const { resolverSettings } = settings;

  return (
    <AnalyticsContext pageSectionContext="ultraFeed" ultraFeedContext={{ feedSessionId: sessionId }}>
      <AnalyticsInViewTracker eventProps={{inViewType: "ultraFeed"}}>
      <div className={classes.root} ref={feedContainerRef}>
        <UltraFeedObserverProvider incognitoMode={resolverSettings.incognitoMode}>
        <OverflowNavObserverProvider>
            {settingsVisible && (
              <div className={useExternalContainer ? classes.settingsContainerExternal : classes.settingsContainer}>
                {activeTab === 'ultraFeed' ? (
                  <UltraFeedSettings 
                    settings={settings}
                    updateSettings={updateSettings}
                    onClose={() => onCloseSettings?.()} 
                    truncationMaps={truncationMaps}
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

            {infoVisible && activeTab === 'ultraFeed' && (
              <div className={useExternalContainer ? classes.settingsContainerExternal : classes.settingsContainer}>
                <UltraFeedInfo />
              </div>
            )}
            
            <div className={classes.ultraFeedNewContentContainer} style={isTransitioning ? { minHeight: FEED_MIN_HEIGHT } : undefined}>
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
                    isActive={activeTab === 'ultraFeed'}
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
                      isActive={activeTab === 'following'}
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
    </AnalyticsContext>
  );
};

const UltraFeed = ({
  alwaysShow = false,
  hideTitle = false,
  settingsVisible,
  onSettingsToggle,
}: {
  alwaysShow?: boolean
  hideTitle?: boolean
  settingsVisible?: boolean
  onSettingsToggle?: () => void
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent([ULTRA_FEED_ACTIVE_TAB_COOKIE]);
  const [internalSettingsVisible, setInternalSettingsVisible] = useState(false);
  const [internalInfoVisible, setInternalInfoVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedType>(() => (cookies[ULTRA_FEED_ACTIVE_TAB_COOKIE] === 'following' ? 'following' : 'ultraFeed'));
  const { captureEvent } = useTracking();
  const { settings, updateSettings, truncationMaps } = useUltraFeedSettings();

  const handleTabChange = (tab: FeedType) => {
    setActiveTab(tab);
    setCookie(ULTRA_FEED_ACTIVE_TAB_COOKIE, tab, { path: '/' });
    // Close settings and info panels when switching to Following tab
    if (tab === 'following') {
      if (internalInfoVisible) {
        setInternalInfoVisible(false);
      }
      if (internalSettingsVisible) {
        setInternalSettingsVisible(false);
      }
    }
    captureEvent("ultraFeedTabChanged", { tab });
  };

  if (!ultraFeedEnabledSetting.get()) {
    return (
      <SingleColumnSection>
        <div className={classes.disabledMessage}>
          The New Feed is currently disabled.
        </div>
      </SingleColumnSection>
    );
  }

  const isControlled = onSettingsToggle !== undefined;
  const actualSettingsVisible = isControlled ? settingsVisible : internalSettingsVisible;

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    captureEvent("ultraFeedSettingsToggled", { open: !actualSettingsVisible });
    if (isControlled) {
      onSettingsToggle?.();
    } else {
      setInternalSettingsVisible(!internalSettingsVisible);
      if (!internalSettingsVisible && internalInfoVisible) {
        setInternalInfoVisible(false);
      }
    }
  };

  const toggleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    captureEvent("ultraFeedInfoToggled", { open: !internalInfoVisible });
    setInternalInfoVisible(!internalInfoVisible);
    // Close settings when opening info
    if (!internalInfoVisible && internalSettingsVisible) {
      setInternalSettingsVisible(false);
    }
  };


  return (
    <>
      <SingleColumnSection>
        <UltraFeedHeader
          hideTitle={hideTitle}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          settingsButton={!isControlled && activeTab === 'ultraFeed' ? (
            <div className={classes.headerButtons}>
              <InfoButton onClick={toggleInfo} isActive={internalInfoVisible} tooltip="What is the For You feed?" />
              <SettingsButton showIcon={true} onClick={toggleSettings} />
            </div>
          ) : undefined}
          feedSettings={settings}
          updateFeedSettings={updateSettings}
        />
        <DeferRender ssr={false}>
          <UltraFeedContent 
            settings={settings}
            updateSettings={updateSettings}
            truncationMaps={truncationMaps}
            alwaysShow={alwaysShow}
            settingsVisible={actualSettingsVisible}
            onCloseSettings={isControlled ? onSettingsToggle : () => setInternalSettingsVisible(false)}
            infoVisible={internalInfoVisible}
            useExternalContainer={isControlled}
            activeTab={activeTab}
          />
        </DeferRender>
      </SingleColumnSection>
    </>
  );
};

export default UltraFeed;

 
