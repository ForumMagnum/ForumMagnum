import React, { useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE } from '../../lib/cookies/cookies';
import { userHasUltraFeed } from '../../lib/betas';
import type { ObservableQuery } from '@apollo/client';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { DEFAULT_SETTINGS, UltraFeedSettingsType, ULTRA_FEED_SETTINGS_KEY, getResolverSettings } from './ultraFeedSettingsTypes';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { isClient } from '../../lib/executionEnvironment';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import MixedTypeFeed from "../common/MixedTypeFeed";
import UltraFeedPostItem from "./UltraFeedPostItem";
import FeedItemWrapper from "./FeedItemWrapper";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import SettingsButton from "../icons/SettingsButton";
import SpotlightFeedItem from "../spotlights/SpotlightFeedItem";
import UltraFeedSettings from "./UltraFeedSettings";
import UltraFeedThreadItem from "./UltraFeedThreadItem";
import SpotlightItem from "../spotlights/SpotlightItem";

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
    width: '100%',
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
    marginBottom: 32,
  },
  hiddenOnDesktop: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  hiddenOnMobile: {
    display: 'block',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  ultraFeedSpotlightTitle: {
    '& .SpotlightItem-title': {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontVariant: 'normal',
      fontSize: '1.4rem',
      fontWeight: 600,
      opacity: 0.8,
      lineHeight: 1.15,
      marginBottom: 8,
      textWrap: 'balance',
      width: '100%',
      '& a:hover': {
        opacity: 0.9,
      },
    },
  },
  checkboxLabel: {
    whiteSpace: 'nowrap',
  },
}));

const UltraFeedContent = ({alwaysShow = false}: {
  alwaysShow?: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [ultraFeedCookie, setUltraFeedCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  const ultraFeedEnabledCookie = ultraFeedCookie[ULTRA_FEED_ENABLED_COOKIE] === "true";
  const ultraFeedEnabled = !!currentUser && (ultraFeedEnabledCookie || alwaysShow);
  
  const [settings, setSettings] = useState<UltraFeedSettingsType>(getStoredSettings);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return randomId();
    const storage = window.sessionStorage;
    const currentId = storage ? storage.getItem(ULTRAFEED_SESSION_ID_KEY) ?? randomId() : randomId();
    storage.setItem(ULTRAFEED_SESSION_ID_KEY, currentId);
    return currentId;
  });
  
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);

  if (!(userIsAdminOrMod(currentUser) || ultraFeedEnabled || alwaysShow)) {
    return null;
  }

  const toggleUltraFeed = () => {
    setUltraFeedCookie(ULTRA_FEED_ENABLED_COOKIE, String(!ultraFeedEnabledCookie), { path: "/" });
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

  const resolverSettings = getResolverSettings(settings);
  
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

  const checkBoxLabel = alwaysShow ? "Use New Feed on Frontpage" : "Use New Feed";

  return (
    <AnalyticsContext pageSectionContext="ultraFeed" ultraFeedContext={{ sessionId }}>
    <div className={classes.root}>
      <div className={classes.toggleContainer}>
        <SectionFooterCheckbox 
          value={ultraFeedEnabledCookie} 
          onClick={toggleUltraFeed} 
          label={checkBoxLabel}
          tooltip="Hide Quick Takes and Popular Comments sections and show a feed of posts and comments from users you subscribe to"
          labelClassName={classes.checkboxLabel}
        />
      </div>
      
      {ultraFeedEnabled && <>
        <UltraFeedObserverProvider incognitoMode={settings.incognitoMode}>
        <OverflowNavObserverProvider>
          <SingleColumnSection>
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
                pageSize={30}
                refetchRef={refetchSubscriptionContentRef}
                resolverArgsValues={{ sessionId, settings: JSON.stringify(resolverSettings) }}
                loadMoreDistanceProp={1000}
                fetchPolicy="cache-first"
                renderers={{
                  feedCommentThread: {
                    fragmentName: 'FeedCommentThreadFragment',
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
                    fragmentName: 'FeedPostFragment',
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
                    fragmentName: 'FeedSpotlightFragment',
                    render: (item: FeedSpotlightFragment, index: number) => {
                      const { spotlight } = item;
                      if (!spotlight) {
                        return null;
                      }

                      return (
                        <FeedItemWrapper>
                          <span className={classes.hiddenOnDesktop}>
                            <SpotlightFeedItem 
                              spotlight={spotlight}
                              showSubtitle={true}
                              index={index}
                            />
                          </span>
                          <span className={classes.hiddenOnMobile}>
                            <SpotlightItem 
                              spotlight={spotlight}
                              showSubtitle={true}
                              className={classes.ultraFeedSpotlightTitle}
                            />
                          </span>
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
      </>}
    </div>
    </AnalyticsContext>
  );
};

const UltraFeed = ({alwaysShow = false}: {
  alwaysShow?: boolean
}) => {
  return (
    <DeferRender ssr={false}>
      <UltraFeedContent alwaysShow={alwaysShow} />
    </DeferRender>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
