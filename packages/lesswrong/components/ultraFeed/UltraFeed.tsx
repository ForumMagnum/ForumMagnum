import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import type { ObservableQuery } from '@apollo/client';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { DEFAULT_SETTINGS, UltraFeedSettingsType, ULTRA_FEED_SETTINGS_KEY } from './ultraFeedSettingsTypes';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { isClient } from '../../lib/executionEnvironment';
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
import classNames from 'classnames';
import UltraFeedFeedback from './UltraFeedFeedback';
import AnalyticsInViewTracker from '../common/AnalyticsInViewTracker';

const ULTRAFEED_SESSION_ID_KEY = 'ultraFeedSessionId';

const getStoredSettings = (): UltraFeedSettingsType => {
  if (!isClient) return DEFAULT_SETTINGS;
  
  const ls = getBrowserLocalStorage();
  if (!ls) return DEFAULT_SETTINGS;
  
  const storedSettings = ls.getItem(ULTRA_FEED_SETTINGS_KEY);
  if (!storedSettings) return DEFAULT_SETTINGS;
  
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse UltraFeed settings", e);
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings: Partial<UltraFeedSettingsType>): UltraFeedSettingsType => {
  const ls = getBrowserLocalStorage();
  if (!ls) return DEFAULT_SETTINGS;
  
  const currentSettings = getStoredSettings();
  const newSettings = { ...currentSettings, ...settings };
  
  ls.setItem(ULTRA_FEED_SETTINGS_KEY, JSON.stringify(newSettings));
  return newSettings;
};

const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  root: {
    // Remove padding inserted by Layout.tsx to be flush with sides of screen
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
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
  },
  settingsContainer: {
    marginBottom: 32,
  },
  hiddenOnDesktop: {
    // because of conflicting styles (this is all temporary code anyhow)
    display: 'none !important',
    [theme.breakpoints.down('sm')]: {
      display: 'block !important',
    },
  },
  hiddenOnMobile: {
    display: 'block',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
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
  feedSelectorMobileContainer: {
    // marginTop: 8,
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'center',
  },
}));

const UltraFeedContent = ({alwaysShow = false}: {
  alwaysShow?: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const [settings, setSettings] = useState<UltraFeedSettingsType>(getStoredSettings);
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return randomId();
    const storage = window.sessionStorage;
    const currentId = storage ? storage.getItem(ULTRAFEED_SESSION_ID_KEY) ?? randomId() : randomId();
    storage.setItem(ULTRAFEED_SESSION_ID_KEY, currentId);
    return currentId;
  });
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);

  const handleOpenQuickTakeDialog = () => {
    captureEvent("ultraFeedComposerQuickTakeDialogOpened");
    openDialog({
      name: "UltraFeedQuickTakeDialog",
      contents: ({onClose}) => <UltraFeedQuickTakeDialog onClose={onClose} currentUser={currentUser} />
    });
  };

  if (!currentUser) {
    return null;
  }

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    captureEvent("ultraFeedSettingsToggled", { open: !settingsVisible });
    setSettingsVisible(!settingsVisible);
  };
  
  const updateSettings = (newSettings: Partial<UltraFeedSettingsType>) => {
    const updatedSettings = saveSettings(newSettings);
    setSettings(updatedSettings);
    captureEvent("ultraFeedSettingsUpdated", { 
      changedSettings: Object.keys(newSettings) 
    });
  };
  
  const resetSettingsToDefault = () => {
    const defaultSettings = saveSettings(DEFAULT_SETTINGS);
    setSettings(defaultSettings);
    captureEvent("ultraFeedSettingsReset");
  };

  const { resolverSettings } = settings;
  
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
    <AnalyticsContext pageSectionContext="ultraFeed" ultraFeedContext={{ feedSessionId: sessionId }}>
      <AnalyticsInViewTracker eventProps={{inViewType: "ultraFeed"}}>
      <div className={classes.root}>
        <UltraFeedObserverProvider incognitoMode={resolverSettings.incognitoMode}>
        <OverflowNavObserverProvider>
          <SingleColumnSection>
            <SectionTitle title={customTitle} titleClassName={classes.sectionTitle}>
              <div className={classes.feedCheckboxAndSettingsContainer}>
              {!alwaysShow && <div className={classes.hiddenOnMobile}>
                <FeedSelectorDropdown currentFeedType="new" showFeedback={showFeedback} onFeedbackClick={() => setShowFeedback(!showFeedback)} />
              </div>}
              <div className={classes.settingsButtonContainer}>
                <SettingsButton 
                  showIcon={true}
                  onClick={toggleSettings}
                />
              </div>
            </div>
            </SectionTitle>
            {!alwaysShow && <div className={classNames(classes.hiddenOnDesktop, classes.feedSelectorMobileContainer)}>
              <FeedSelectorDropdown currentFeedType="new" showFeedback={showFeedback} onFeedbackClick={() => setShowFeedback(!showFeedback)} />
            </div>}
            {showFeedback && <UltraFeedFeedback />}

            {settingsVisible && (
              <div className={classes.settingsContainer}>
                <UltraFeedSettings 
                  settings={settings}
                  updateSettings={updateSettings}
                  resetSettingsToDefault={resetSettingsToDefault}
                  onClose={() => setSettingsVisible(false)} 
                />
              </div>
            )}
            
            <div className={classes.ultraFeedNewContentContainer}>
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
                renderers={{
                  feedCommentThread: {
                    render: (item: FeedCommentThreadFragment, index: number) => {
                      if (!item) {
                        return null;
                      }
                      
                      return (
                        <FeedItemWrapper>
                          <UltraFeedThreadItem
                            thread={item}
                            settings={settings}
                            index={index}
                          />
                        </FeedItemWrapper>
                      );
                    }
                  },
                  feedPost: {
                    render: (item: FeedPostFragment, index: number) => {
                      if (!item) {
                        return null;
                      }
                      
                      return (
                        <FeedItemWrapper>
                          <UltraFeedPostItem
                            post={item.post}
                            postMetaInfo={item.postMetaInfo}
                            settings={settings}
                            index={index} 
                          />
                        </FeedItemWrapper>
                      );
                    }
                  },
                  feedSpotlight: {
                    render: (item: FeedSpotlightFragment, index: number) => {
                      const { spotlight, post } = item;
                      if (!spotlight) {
                        return null;
                      }

                      return (
                        <FeedItemWrapper>
                          <UltraFeedSpotlightItem 
                            spotlight={spotlight}
                            post={post ?? undefined}
                            showSubtitle={true}
                            index={index}
                          />
                        </FeedItemWrapper>
                      );
                    }
                  }
                }}
              />
            </div>
          </SingleColumnSection>
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

const UltraFeed = ({alwaysShow = false}: {
  alwaysShow?: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

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

  return (
    <>
      <DeferRender ssr={false}>
        <UltraFeedContent alwaysShow={alwaysShow} />
      </DeferRender>
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
