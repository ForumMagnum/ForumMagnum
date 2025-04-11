import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE } from '../../lib/cookies/cookies';
import { userHasUltraFeed } from '../../lib/betas';
import type { ObservableQuery } from '@apollo/client';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { DEFAULT_SETTINGS, UltraFeedSettingsType, ULTRA_FEED_SETTINGS_KEY } from './ultraFeedSettingsTypes';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { isClient } from '../../lib/executionEnvironment';

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
  toggleContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 8,
    marginRight: 8,
  },
  feedComementItem: {
    marginBottom: 16
  },
  sectionTitle: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    display: 'flex',
    flex: '1 1 0',
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    minHeight: 24,
    '&:hover': {
      opacity: 0.8
    }
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
    marginLeft: 12,
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    },
  },
  settingsButtonContainer: {
    flex: '1 1 0',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8
  },
  ultraFeedNewContentContainer: {
  },
  settingsContainer: {
    marginBottom: 20,
    background: theme.palette.panelBackground.default,
    borderRadius: 3,
    padding: '16px 12px',
    boxShadow: theme.palette.boxShadow.default,
  },
}));

const UltraFeedContent = () => {
  const classes = useStyles(styles);
  const { SectionFooterCheckbox, MixedTypeFeed, UltraFeedPostItem,
    FeedItemWrapper, SectionTitle, SingleColumnSection, SettingsButton, 
    SpotlightFeedItem, UltraFeedSettings, UltraFeedThreadItem } = Components;
  
  const currentUser = useCurrentUser();
  const [ultraFeedCookie, setUltraFeedCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  const ultraFeedEnabled = ultraFeedCookie[ULTRA_FEED_ENABLED_COOKIE] === "true";
  
  const [settings, setSettings] = useState<UltraFeedSettingsType>(getStoredSettings);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sessionId] = useState(() => randomId());
  
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);

  if (!userHasUltraFeed(currentUser)) {
    return null;
  }

  const toggleUltraFeed = () => {
    setUltraFeedCookie(ULTRA_FEED_ENABLED_COOKIE, String(!ultraFeedEnabled), { path: "/" });
  };

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSettingsVisible(!settingsVisible);
  };
  
  const updateSettings = (newSettings: Partial<UltraFeedSettingsType>) => {
    const updatedSettings = saveSettings(newSettings);
    setSettings(updatedSettings);
  };
  
  const resetSettingsToDefault = () => {
    const defaultSettings = saveSettings(DEFAULT_SETTINGS);
    setSettings(defaultSettings);
  };
  
  const customTitle = <>
    <div className={classes.titleContainer}>
      <span className={classes.titleText}>
        <span className={classes.titleTextDesktop}>Update Feed</span>
        <span className={classes.titleTextMobile}>The Feed</span>
      </span>
    </div>
    <div className={classes.settingsButtonContainer}>
      <SettingsButton 
        showIcon={true}
        onClick={toggleSettings}
      />
    </div>
  </>;

  return (
    <div className={classes.root}>
      <div className={classes.toggleContainer}>
        <SectionFooterCheckbox 
          value={ultraFeedEnabled} 
          onClick={toggleUltraFeed} 
          label="Use UltraFeed"
          tooltip="Hide Quick Takes and Popular Comments sections and show a feed of posts and comments from users you subscribe to"
        />
      </div>
      
      {ultraFeedEnabled && <>
        <UltraFeedObserverProvider>
          <SingleColumnSection>
            {/* place this higher than top feed so it properly scrolls into view */}
            <SectionTitle title={customTitle} titleClassName={classes.sectionTitle} />
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
                resolverName="UltraFeed"
                sortKeyType="Date"
                resolverArgs={{ sessionId: "String", settings: "JSON" }}
                firstPageSize={15}
                pageSize={15}
                refetchRef={refetchSubscriptionContentRef}
                resolverArgsValues={{ sessionId, settings: JSON.stringify(settings) }}
                loadMoreDistanceProp={1000}
                renderers={{
                  feedCommentThread: {
                    fragmentName: 'FeedCommentThreadFragment',
                    render: (item: FeedCommentThreadFragment) => {
                      if (!item) {
                        return null;
                      }
                      
                      return (
                        <FeedItemWrapper>
                          <UltraFeedThreadItem thread={item} settings={settings} />
                        </FeedItemWrapper>
                      );
                    }
                  },
                  feedPost: {
                    fragmentName: 'FeedPostFragment',
                    render: (item: FeedPostFragment) => {
                      if (!item) {
                        return null;
                      }
                      
                      return (
                        <FeedItemWrapper>
                          <UltraFeedPostItem post={item.post} postMetaInfo={item.postMetaInfo} settings={settings} />
                        </FeedItemWrapper>
                      );
                    }
                  },
                  feedSpotlight: {
                    fragmentName: 'FeedSpotlightFragment',
                    render: (item: FeedSpotlightFragment) => {
                      const { spotlight } = item;
                      if (!spotlight) {
                        return null;
                      }

                      return (
                        <FeedItemWrapper>
                          <SpotlightFeedItem 
                            spotlight={spotlight}
                            showSubtitle={true}
                          />
                        </FeedItemWrapper>
                      );
                    }
                  }
                }}
              />
            </div>
          </SingleColumnSection>
        </UltraFeedObserverProvider>
      </>}
    </div>
  );
};

const UltraFeed = () => {
  return (
    // TODO: possibly defer render shouldn't apply to the section title?
    <DeferRender ssr={false}>
      <UltraFeedContent />
    </DeferRender>
  );
};

const UltraFeedComponent = registerComponent('UltraFeed', UltraFeed);

declare global {
  interface ComponentTypes {
    UltraFeed: typeof UltraFeedComponent
  }
} 
