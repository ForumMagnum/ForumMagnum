import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import type { ObservableQuery } from '@apollo/client';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { FeedItemSourceType } from './ultraFeedTypes';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { MixedTypeFeed } from "../common/MixedTypeFeed";
import UltraFeedPostItem from "./UltraFeedPostItem";
import FeedItemWrapper from "./FeedItemWrapper";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import SettingsButton from "../icons/SettingsButton";
import UltraFeedSpotlightItem from "./UltraFeedSpotlightItem";
import UltraFeedSettings from "./UltraFeedSettings";
import UltraFeedThreadItem from "./UltraFeedThreadItem";
import { UltraFeedQuery } from '../common/feeds/feedQueries';
import ForumIcon from '../common/ForumIcon';
import UltraFeedQuickTakeDialog from './UltraFeedQuickTakeDialog';
import { useDialog } from '../common/withDialog';
import FeedSelectorDropdown from '../common/FeedSelectorCheckbox';
import { ultraFeedEnabledSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import AnalyticsInViewTracker from '../common/AnalyticsInViewTracker';
import UltraFeedBottomBar from './UltraFeedBottomBar';
import Loading from '../vulcan-core/Loading';
import { createUltraFeedRenderers } from './renderers/createUltraFeedRenderers';


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
  },
  titleContainer: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'center',
    color: theme.palette.text.bannerAdOverlay,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 8,
    },
  },
  titleText: {
  },
  titleTextDesktop: {
    display: 'inline',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  titleTextMobile: {
    display: 'none',
    marginLeft: 8,
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    },
  },
  feedCheckboxAndSettingsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // gap: 24, // Add spacing between items
  },
  settingsButtonContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  ultraFeedNewContentContainer: {
    position: 'relative',
  },
  settingsContainer: {
    marginBottom: 32,
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
  settingsVisible,
  onCloseSettings,
  useExternalContainer,
}: {
  alwaysShow?: boolean
  settingsVisible?: boolean
  onCloseSettings?: () => void
  useExternalContainer?: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTopVisible, setIsTopVisible] = useState(true);
  const [isFeedInView, setIsFeedInView] = useState(false);

  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const { settings, updateSettings, resetSettings, truncationMaps } = useUltraFeedSettings();
  const [sessionId] = useState<string>(randomId);
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);

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

  const handleRefreshFeed = () => {
    if (refetchSubscriptionContentRef.current) {
      setIsRefreshing(true);
      void refetchSubscriptionContentRef.current().finally(() => {
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
                <UltraFeedSettings 
                  settings={settings}
                  updateSettings={updateSettings}
                  resetSettingsToDefault={resetSettingsToDefault}
                  onClose={() => onCloseSettings?.()} 
                  truncationMaps={truncationMaps}
                />
              </div>
            )}
            
            <div className={classes.ultraFeedNewContentContainer}>
              {isRefreshing && <div className={classes.refetchLoading}>
                <Loading />
              </div>}
              <MixedTypeFeed
                query={UltraFeedQuery}
                variables={{
                  sessionId,
                  settings: JSON.stringify(resolverSettings),
                }}
                firstPageSize={15}
                pageSize={30}
                refetchRef={refetchSubscriptionContentRef}
                loadMoreDistanceProp={1000}
                fetchPolicy="cache-first"
                renderers={createUltraFeedRenderers({ settings })}
              />
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
      <UltraFeedBottomBar
        refetchFeed={handleRefreshFeed}
        isTopVisible={isTopVisible}
        isFeedInView={isFeedInView}
        feedRootEl={feedContainerRef.current} />
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
  const [internalSettingsVisible, setInternalSettingsVisible] = useState(false);
  const { captureEvent } = useTracking();

  if (!currentUser) {
    return null;
  }

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
    }
  };

  const customTitle = <>
    <div className={classes.titleContainer}>
      <span className={classes.titleText}>
        <Link to="/feed" className={classes.titleLink}>
          Update Feed
        </Link>
      </span>
    </div>
  </>;

  return (
    <>
      <SingleColumnSection>
        {!hideTitle && (
          <SectionTitle title={customTitle} titleClassName={classes.sectionTitle}>
            <DeferRender ssr={false}>
              <div className={classes.feedCheckboxAndSettingsContainer}>
                {!alwaysShow && <FeedSelectorDropdown currentFeedType="new" />}
                {!isControlled && (
                  <div className={classes.settingsButtonContainer}>
                    <SettingsButton 
                      showIcon={true}
                      onClick={toggleSettings}
                    />
                  </div>
                )}
              </div>
            </DeferRender>
          </SectionTitle>
        )}
        <DeferRender ssr={false}>
          <UltraFeedContent 
            alwaysShow={alwaysShow}
            settingsVisible={actualSettingsVisible}
            onCloseSettings={isControlled ? onSettingsToggle : () => setInternalSettingsVisible(false)}
            useExternalContainer={isControlled}
          />
        </DeferRender>
      </SingleColumnSection>
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
