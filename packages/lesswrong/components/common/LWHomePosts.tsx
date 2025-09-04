import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { FilterSettings, useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { useContinueReading } from '../recommendations/withContinueReading';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import TabPicker, { TabRecord } from './TabPicker';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE, RECOMBEE_SETTINGS_COOKIE, SELECTED_FRONTPAGE_TAB_COOKIE } from '../../lib/cookies/cookies';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { PostFeedDetails, homepagePostFeedsSetting } from '../../lib/instanceSettings';
import { gql } from "@/lib/generated/gql-codegen";
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';
import { vertexEnabledSetting } from '../../lib/publicSettings';
import { isServer } from '@/lib/executionEnvironment';
import isEqual from 'lodash/isEqual';
import { capitalize } from "../../lib/vulcan-lib/utils";
import SettingsButton from "../icons/SettingsButton";
import SingleColumnSection from "./SingleColumnSection";
import PostsList2 from "../posts/PostsList2";
import TagFilterSettings from "../tagging/TagFilterSettings";
import { RecombeePostsList } from "../posts/RecombeePostsList";
import CuratedPostsList from "../recommendations/CuratedPostsList";
import RecombeePostsListSettings from "../posts/RecombeePostsListSettings";
import BookmarksList from "../bookmarks/BookmarksList";
import ContinueReadingList from "../recommendations/ContinueReadingList";
import WelcomePostItem from "../recommendations/WelcomePostItem";
import { SuspenseWrapper } from './SuspenseWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import PostsLoading from '../posts/PostsLoading';
import { registerComponent } from '@/lib/vulcan-lib/components';
import AnalyticsInViewTracker from './AnalyticsInViewTracker';
import UltraFeedSubscriptionsFeed from '../ultraFeed/UltraFeedSubscriptionsFeed';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import SubscribedHideReadCheckbox from '../ultraFeed/SubscribedHideReadCheckbox';
import UltraFeedMainFeed from '../ultraFeed/UltraFeedMainFeed';
import UltraFeedWrappers from '../ultraFeed/UltraFeedWrappers';
import UltraFeedSettings from '../ultraFeed/UltraFeedSettings';
import UltraFeedFollowingSettings from '../ultraFeed/UltraFeedFollowingSettings';



// Key is the algorithm/tab name
type RecombeeCookieSettings = [string, RecombeeConfiguration][];

const styles = defineStyles("LWHomePost", (theme: ThemeType) => ({
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto"
  },
  toggleFilters: {
    [theme.breakpoints.up('sm')]: {
      display: "none"
    },
  },
  hide: {
    display: "none"
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    },
  },
  titleWrapper: {
    marginBottom: 8
  },
  settingsVisibilityControls: {
    display: "flex",
    marginBottom: "8px",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabPicker: {
    minWidth: 0,
    marginRight: 10,
  },
  tagFilterSettingsButtonContainerDesktop: {
    [theme.breakpoints.up('md')]: {
      alignSelf: "end",
      opacity: 0.8,
      display: "flex",
      border: theme.palette.greyBorder("1px", 0.07),
      borderRadius: 3,
      background: theme.palette.panelBackground.bannerAdTranslucent,
      padding: "5.5px",
    },
  },
  tagFilterSettingsButtonContainerMobile: {
    [theme.breakpoints.down('sm')]: {
      alignSelf: "end",
      opacity: 0.8,
    },
    [theme.breakpoints.up('md')]: {
      display: "none",
    },
  },
  tagFilterSettingsButtonContainerMobileBackground: {
    [theme.breakpoints.down('sm')]: {
      display: "flex",
      border: theme.palette.greyBorder("1px", 0.07),
      borderRadius: 3,
      background: theme.palette.panelBackground.default,
      padding: "5.5px",
      [theme.breakpoints.down('xs')]: {
        padding: "4.5px",
      },
    },
    [theme.breakpoints.up('md')]: {
      display: "none",
    },
  },
  ultraFeedSettingsContainer: {
    marginTop: 16,
  },
  ultraFeedFollowingSettingsContainer: {
    marginTop: 16,
  },
  hideDesktopSettingsButtonOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  subscribedAnnouncementPost: {
    marginBottom: 32,
  },
  suggestedUsersHideLabel: {
    ...theme.typography.commentStyle,
    padding: 4,
    fontSize: "1rem",
    color: "unset",
    opacity: 0.7,
    '&:hover': {
      opacity: 0.5,
    }
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[600],
  },
  checkboxInput: {
    padding: 4,
    color: theme.palette.grey[500],
  },
  checkboxLabel: {
    cursor: 'pointer',
    fontSize: '1.15rem',
    fontFamily: theme.typography.fontFamily,
    textWrap: 'nowrap',
  },
  enrichedTagFilterNotice: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.slightlyDim2,
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 3,
  },
  ultraFeedFollowingHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
}));

export const filterSettingsToggleLabels = {
  desktopVisible: "Customize (Hide)",
  desktopHidden: "Customize",
  mobileVisible: "Customize (Hide)",
  mobileHidden: "Customize",
};

const advancedSortingText = "Advanced Sorting/Filtering";

const defaultLimit = 13;

function getDefaultDesktopFilterSettingsVisibility(currentUser: UsersCurrent | null) {
  if (!currentUser) {
    return false;
  }

  // Hide unless user has explicitly set it to visible
  return currentUser?.hideFrontpageFilterSettingsDesktop === false;
}

type Platform = 'mobile' | 'desktop';

type PlatformSettingsVisibility<T extends Platform> = {
  [k in T as `${k}SettingsVisible`]: boolean;
};

type PlatformSettingsVisibilityToggle<T extends Platform> = {
  [k in T as `toggle${Capitalize<k>}SettingsVisible`]: (newVisibilityState: boolean) => void;
};

type PlatformSettingsVisibilityState<T extends Platform> = PlatformSettingsVisibility<T> & PlatformSettingsVisibilityToggle<T>;

function useDefaultSettingsVisibility<T extends Platform>(currentUser: UsersCurrent | null, platform: T, selectedAlgorithm?: string): PlatformSettingsVisibilityState<T> {
  const updateCurrentUser = useUpdateCurrentUser();
  const [tabSettingsVisible, setTabSettingsVisible] = useState(
    platform === 'mobile'
      ? false
      : getDefaultDesktopFilterSettingsVisibility(currentUser)
  );

  const toggleSettingsVisible = useCallback((newVisibilityState: boolean) => {
    setTabSettingsVisible(newVisibilityState);
    if (selectedAlgorithm !== 'ultrafeed') {
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: !newVisibilityState})
    }
  }, [selectedAlgorithm, updateCurrentUser]);

  return {
    [`${platform}SettingsVisible`]: tabSettingsVisible,
    [`toggle${capitalize(platform)}SettingsVisible`]: toggleSettingsVisible
  } as PlatformSettingsVisibilityState<T>;
};

function getTabOrDefault(tabName: string | null, enabledTabs: TabRecord[], overrideDefaultTab?: string) {
  const defaultTab = overrideDefaultTab
    ?? enabledTabs.find(tab => tab.defaultTab)?.name
    ?? 'forum-classic';

  return enabledTabs.find(tab => tab.name === tabName)?.name ?? defaultTab;
}
 
function useSelectedTab(currentUser: UsersCurrent|null, enabledTabs: TabRecord[]): [selectedTab: string, setSelectedTab: (newTab: string) => void] {
  const updateCurrentUser = useUpdateCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent([SELECTED_FRONTPAGE_TAB_COOKIE]);
  const { captureEvent } = useTracking();

  const cookieTab = cookies[SELECTED_FRONTPAGE_TAB_COOKIE];
  const isReturningVisitor = isServer ? !!cookies[LAST_VISITED_FRONTPAGE_COOKIE] : !!window.isReturningVisitor;

  let currentTab: string;

  if (!currentUser) {
    if (isReturningVisitor) {
      currentTab = getTabOrDefault(cookieTab, enabledTabs);
    } else {
      currentTab = 'forum-classic';
    }
  } else {
    // If the user has a selected tab that is not in the list of enabled tabs,
    // 1. first see if there's a cookie (representing a valid, enabled tab) to default to
    // 2. if not, fall back to the regular default logic
    currentTab = getTabOrDefault(
      currentUser.frontpageSelectedTab,
      enabledTabs,
      getTabOrDefault(cookieTab, enabledTabs)
    );
  }

  const [selectedTab, setSelectedTab] = useState<string>(currentTab);
  const updateSelectedTab = (newTab: string) => {
    captureEvent("postFeedSwitched", {
      previousTab: selectedTab,
      newTab,
    });

    setSelectedTab(newTab);
    setCookie(SELECTED_FRONTPAGE_TAB_COOKIE, newTab, { path: '/' });
    void updateCurrentUser({ frontpageSelectedTab: newTab });
  };

  return [selectedTab, updateSelectedTab];
};

function isTabEnabled(
  tab: PostFeedDetails,
  currentUser: UsersCurrent | null,
  query: Record<string, string>,
  hasContinueReading: boolean,
): boolean {
  if (tab.disabled) {
    return false;
  }

  const isUserLoggedIn = !!currentUser;
  const isAdminOrExperimental = userIsAdmin(currentUser) || query.experimentalTabs === 'true';
  const enabledForLoggedInUsers = !tab.adminOnly || isAdminOrExperimental;
  const enabledForLoggedOutUsers = !!tab.showToLoggedOut;

  const enabledForCurrentUser = (isUserLoggedIn && enabledForLoggedInUsers) || enabledForLoggedOutUsers;

  const activeFeedTabDisabled = (tab.name === 'ultrafeed' || tab.name === 'following') && !isUserLoggedIn;

  const hasBookmarks = currentUser?.hasAnyBookmarks ?? false;
  const activeBookmarkTabDisabled = tab.name === 'forum-bookmarks' && !hasBookmarks;

  const activeContinueReadingTabDisabled = tab.name === 'forum-continue-reading' && !hasContinueReading;

  return enabledForCurrentUser && !activeFeedTabDisabled && !activeBookmarkTabDisabled && !activeContinueReadingTabDisabled;
}

const defaultRecombeeConfig: RecombeeConfiguration = {
  rotationRate: 0.2,
  rotationTime: 24 * 30,
};

function useRecombeeSettings(currentUser: UsersCurrent|null, enabledTabs: TabRecord[], filterSettings: FilterSettings) {
  const [cookies, setCookie] = useCookiesWithConsent([RECOMBEE_SETTINGS_COOKIE]);
  const recombeeCookieSettings: RecombeeCookieSettings = cookies[RECOMBEE_SETTINGS_COOKIE] ?? [];
  const [storedActiveScenario, storedActiveScenarioConfig] = recombeeCookieSettings[0] ?? [];
  const currentScenarioConfig = storedActiveScenarioConfig ?? defaultRecombeeConfig;
  const scenarioConfigWithFilterSettings = { ...currentScenarioConfig, filterSettings };
  const [scenarioConfig, setScenarioConfig] = useState<RecombeeConfiguration>(scenarioConfigWithFilterSettings);
  const [selectedTab] = useSelectedTab(currentUser, enabledTabs);

  const updateScenarioConfig = (newScenarioConfig: RecombeeConfiguration) => {
    const newCookieValue: RecombeeCookieSettings = [...recombeeCookieSettings];
    newCookieValue[0][1] = newScenarioConfig;
    setCookie(RECOMBEE_SETTINGS_COOKIE, JSON.stringify(newCookieValue), { path: '/' });
    setScenarioConfig(newScenarioConfig);
  };

  useEffect(() => {
    if (recombeeCookieSettings.length === 0) {
      setCookie(RECOMBEE_SETTINGS_COOKIE, JSON.stringify([[selectedTab, defaultRecombeeConfig]]), { path: '/' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEqual(scenarioConfig.filterSettings, filterSettings)) {
      setScenarioConfig({ ...scenarioConfig, filterSettings });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSettings]);

  return {
    scenarioConfig, updateScenarioConfig
  };
}

const FrontpageSettingsButton = ({
  selectedTab,
  changeShowTagFilterSettingsDesktop,
  toggleMobileSettingsVisible,
  desktopSettingsVisible,
  mobileSettingsVisible,
  mobileSettingsButtonLabel,
  filterSettings,
  styleDesktopButton = true,
  labelOverride,
  labelClassName,
}: {
  selectedTab: string;
  changeShowTagFilterSettingsDesktop: () => void;
  toggleMobileSettingsVisible?: (newVisibilityState: boolean) => void;
  desktopSettingsVisible: boolean;
  mobileSettingsVisible: boolean;
  mobileSettingsButtonLabel: string;
  filterSettings: FilterSettings;
  styleDesktopButton?: boolean;
  labelOverride?: (settingsVisible: boolean) => string;
  labelClassName?: string;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();

  const desktopConfiguration = labelOverride ? {
    showIcon: false,
    label: labelOverride(desktopSettingsVisible)
  } : {
    showIcon: !!currentUser,
  } as const;

  const mobileConfiguration = labelOverride ? {
    showIcon: false,
    label: labelOverride(mobileSettingsVisible)
  } : {
    showIcon: !!currentUser,
    label: !currentUser ? mobileSettingsButtonLabel : undefined
  } as const;

  return <>
    {/* Desktop button */}
    <div className={classNames(classes.hideDesktopSettingsButtonOnMobile, {
      [classes.tagFilterSettingsButtonContainerDesktop]: styleDesktopButton
    })}>
      <SettingsButton
        {...desktopConfiguration}
        labelClassName={labelClassName}
        onClick={changeShowTagFilterSettingsDesktop}
      />
    </div>
    {/* Mobile button */}
    {toggleMobileSettingsVisible && <div className={classNames(classes.tagFilterSettingsButtonContainerMobile, {
      [classes.tagFilterSettingsButtonContainerMobileBackground]: !!currentUser
    })}>
      <SettingsButton
        {...mobileConfiguration}
        onClick={() => {
          toggleMobileSettingsVisible(!mobileSettingsVisible);
          captureEvent("filterSettingsClicked", {
            settingsVisible: !mobileSettingsVisible,
            settings: filterSettings,
            pageSectionContext: "latestPosts",
            mobile: true
          });
        } } />
    </div>}
  </>;
}

const useHasContinueReadingTab = (currentUser: UsersCurrent|null) => {
  if (currentUser) {
    return currentUser.hasContinueReading;
  } else {
    return true;
  }
}

const LWHomePosts = ({ children, }: {
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();

  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const now = useCurrentTime();
  const hasContinueReading = useHasContinueReadingTab(currentUser);

  const [sendVertexViewHomePageEvent] = useMutationNoCache(gql(`
    mutation sendVertexViewHomePageEventMutation {
      sendVertexViewHomePageEvent
    }
  `));

  const availableTabs: PostFeedDetails[] = homepagePostFeedsSetting.get()
  const enabledTabs = availableTabs.filter(tab => isTabEnabled(tab, currentUser, query, hasContinueReading ?? false));

  const [selectedTab, setSelectedTab] = useSelectedTab(currentUser, enabledTabs);
  const selectedTabSettings = availableTabs.find(t=>t.name===selectedTab)!;

  
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  const { filterSettings, suggestedTagsQueryRef, setPersonalBlogFilter, setTagFilter, removeTagFilter } = useFilterSettings();
  const { desktopSettingsVisible, toggleDesktopSettingsVisible } = useDefaultSettingsVisibility(currentUser, 'desktop', selectedTab);
  const { mobileSettingsVisible, toggleMobileSettingsVisible } = useDefaultSettingsVisibility(currentUser, 'mobile', selectedTab);
  
  const { scenarioConfig, updateScenarioConfig } = useRecombeeSettings(currentUser, enabledTabs, filterSettings);
  const { settings: ultraFeedSettings, updateSettings: updateUltraFeedSettings, resetSettings: resetUltraFeedSettings, truncationMaps } = useUltraFeedSettings();

  const changeShowTagFilterSettingsDesktop = () => {
    toggleDesktopSettingsVisible(!desktopSettingsVisible);
    
    captureEvent("filterSettingsClicked", {
      settings: filterSettings,
      filterSettingsVisible: desktopSettingsVisible,
      pageSectionContext: "HomePosts",
    })
  };







  /* Intended behavior for filter settings button visibility:
  - DESKTOP
  -- logged-out: no (default open)
  -- logged-in: yes (default closed)

  - MOBILE
  -- logged-out: yes (default closed)
  -- logged-in: yes (default closed)
  */


  const showInlineTabSettingsButton = (
    selectedTab === 'forum-classic' ||
    selectedTab === 'ultrafeed' ||
    selectedTab === 'following' ||
    selectedTab === 'recombee-hybrid' ||
    (userIsAdmin(currentUser) && selectedTab.includes('recombee'))
  );

  const mobileSettingsButtonLabel = mobileSettingsVisible ? 'Hide' : 'Customize'

  const settingsButtonProps = { selectedTab, changeShowTagFilterSettingsDesktop, desktopSettingsVisible, mobileSettingsVisible, mobileSettingsButtonLabel, filterSettings };

  const inlineTabSettingsButton = <FrontpageSettingsButton
    {...settingsButtonProps}
    toggleMobileSettingsVisible={toggleMobileSettingsVisible}
  />;

  const settingsPotentiallyVisible = desktopSettingsVisible || mobileSettingsVisible;
  const settingsVisibleClassName = classNames({
    [classes.hideOnDesktop]: !desktopSettingsVisible,
    [classes.hideOnMobile]: !mobileSettingsVisible,
  });

  // TODO: Make this also work for logged out users
  const currentFilterSettings = currentUser?.frontpageFilterSettings
  const hasSetAnyFilters = currentFilterSettings === undefined ? false : true;

  const filterSettingsElement = (
    <AnalyticsContext pageSectionContext="tagFilterSettings">
      {settingsPotentiallyVisible && <div className={settingsVisibleClassName}>
        <TagFilterSettings
          filterSettings={filterSettings} 
          suggestedTagsQueryRef={suggestedTagsQueryRef}
          setPersonalBlogFilter={setPersonalBlogFilter} 
          setTagFilter={setTagFilter} 
          removeTagFilter={removeTagFilter} 
          flexWrapEndGrow={false}
        />
        {selectedTab === 'recombee-hybrid' && hasSetAnyFilters && <div className={classes.enrichedTagFilterNotice}>
          In the Enriched tab, filters apply only to "Latest" posts, not "Recommended" posts.
        </div>}
  
      </div>}
    </AnalyticsContext>
  );


  const recombeeSettingsElement = <>
    {settingsPotentiallyVisible && <div className={settingsVisibleClassName}>
      {userIsAdmin(currentUser) && <RecombeePostsListSettings settings={scenarioConfig} updateSettings={updateScenarioConfig} />}
    </div>}
  </>;

  const ultraFeedSettingsElement = (
    <>
      {settingsPotentiallyVisible && <div className={classNames(settingsVisibleClassName, classes.ultraFeedSettingsContainer)}>
        <UltraFeedSettings
          settings={ultraFeedSettings}
          updateSettings={updateUltraFeedSettings}
          resetSettingsToDefault={resetUltraFeedSettings}
          onClose={() => toggleDesktopSettingsVisible(false)}
          truncationMaps={truncationMaps}
        />
      </div>}
    </>
  );

  const ultraFeedFollowingSettingsElement = (
    <>
      {settingsPotentiallyVisible && <div className={classNames(settingsVisibleClassName, classes.ultraFeedFollowingSettingsContainer)}>
        <UltraFeedFollowingSettings
          settings={ultraFeedSettings}
          updateSettings={updateUltraFeedSettings}
          onClose={() => toggleDesktopSettingsVisible(false)}
        />
      </div>}
    </>
  );

  let settings = null;
  if (selectedTab === 'forum-classic') { 
    settings = filterSettingsElement;
  } else if (selectedTab === 'recombee-hybrid') {
    settings = filterSettingsElement;
  } else if (selectedTab === 'ultrafeed') {
    settings = ultraFeedSettingsElement;
  } else if (selectedTab === 'following') {
    settings = ultraFeedFollowingSettingsElement;
  } else if (selectedTab.includes('recombee')) {
    settings = recombeeSettingsElement;
  }

  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get()*24, 'hours').startOf('hour').toISOString();

  const recentPostsTerms: PostsViewTerms = {
    filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit: defaultLimit
  };

  useEffect(() => {
    if (currentUser && vertexEnabledSetting.get()) {
      void sendVertexViewHomePageEvent({});
    }
    // We explicitly only want to send it once on page load, no matter what changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // TODO: do we need capturePostItemOnMount here?
    <AnalyticsInViewTracker
      eventProps={{inViewType: "postsFeed"}}
      observerProps={{threshold:[0, 0.5, 1]}}
    >
    <AnalyticsContext pageSectionContext="postsFeed">
      <SingleColumnSection>
        <div className={classes.settingsVisibilityControls}>
          <div className={classes.tabPicker}>
            <TabPicker 
              sortedTabs={enabledTabs} 
              defaultTab={selectedTab} 
              onTabSelectionUpdate={setSelectedTab}
              showDescriptionOnHover
            />
          </div>
          {showInlineTabSettingsButton && inlineTabSettingsButton}
        </div>
        {settings}
        <SuspenseWrapper name="LWHomePostsInner">
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              {/* LATEST POSTS (Hacker News Algorithm) */}
              {/* Frustratingly, the AnalyticsContext update doesn't update upon switching tab so it's necessary to have a wrapper around each section individually, could be investigated further */}
              {(selectedTab === 'forum-classic') && <AnalyticsContext feedType={selectedTab}>
                <SuspenseWrapper
                  name="LWHomePosts-forum-classic"
                  fallback={<PostsLoading placeholderCount={defaultLimit+2} loadMore/>}
                >
                  <HideRepeatedPostsProvider>
                    <WelcomePostItem repeatedPostsPrecedence={1} />
                    <CuratedPostsList overrideLimit={2} repeatedPostsPrecedence={2}/>
                    <PostsList2
                      terms={recentPostsTerms}
                      alwaysShowLoadMore
                      hideHiddenFrontPagePosts
                      repeatedPostsPrecedence={3}
                    >
                      <Link to={"/allPosts"}>{advancedSortingText}</Link>
                    </PostsList2> 
                  </HideRepeatedPostsProvider>
                </SuspenseWrapper>
              </AnalyticsContext>}
              
              {/* ENRICHED LATEST POSTS */}
              {selectedTab === 'recombee-hybrid' && <AnalyticsContext feedType={selectedTab}>
                <RecombeePostsList 
                  algorithm={'recombee-hybrid'} 
                  settings={{
                    ...scenarioConfig,
                    hybridScenarios: {
                      fixed: 'forum-classic', 
                      configurable: 'recombee-lesswrong-custom'
                    }
                  }} 
                />
              </AnalyticsContext>}

              {/* JUST RECOMMENDATIONS */}
              {selectedTab === 'recombee-lesswrong-custom' && <AnalyticsContext feedType={selectedTab}>
                <RecombeePostsList algorithm={'recombee-lesswrong-custom'} settings={scenarioConfig} />
              </AnalyticsContext>}

              {/* BOOKMARKS */}
              {(selectedTab === 'forum-bookmarks') && <AnalyticsContext feedType={selectedTab}>
                <BookmarksList showMessageIfEmpty={true} limit={13} />
              </AnalyticsContext>}
              
              {/* CONTINUE READING */}
              {(selectedTab === 'forum-continue-reading') && hasContinueReading && <AnalyticsContext feedType={selectedTab}>
                <ContinueReadingTab/>
              </AnalyticsContext>}

              {/* FEED */}
              {(selectedTab === 'ultrafeed') && <UltraFeedWrappers
                feedType="ultraFeed"
                incognitoMode={ultraFeedSettings.resolverSettings.incognitoMode}
              >
                <UltraFeedMainFeed
                  settings={ultraFeedSettings}
                  fetchPolicy="cache-first"
                  firstPageSize={15}
                  pageSize={30}
                />
              </UltraFeedWrappers>}

              {/* FOLLOWING */}
              {(selectedTab === 'following') && <>
                <div className={classes.ultraFeedFollowingHeader}>
                  <SubscribedHideReadCheckbox
                    checked={ultraFeedSettings?.resolverSettings?.subscriptionsFeedSettings?.hideRead ?? false}
                    onChange={(checked) => updateUltraFeedSettings({
                      resolverSettings: {
                        ...ultraFeedSettings.resolverSettings,
                        subscriptionsFeedSettings: {
                          ...ultraFeedSettings.resolverSettings.subscriptionsFeedSettings,
                          hideRead: checked,
                        },
                      },
                    })}
                  />
                </div>
                <UltraFeedWrappers
                  feedType="following"
                  incognitoMode={ultraFeedSettings.resolverSettings.incognitoMode}
                >
                  <UltraFeedSubscriptionsFeed embedded={true} settings={ultraFeedSettings} showHideReadToggle={false} />
                </UltraFeedWrappers>
               </>}

              {/* CHRONOLIGCAL FEED */}
              {(selectedTab === 'forum-chronological') && <AnalyticsContext feedType={selectedTab}>
                <PostsList2 
                  terms={{...recentPostsTerms, view: "new"}} 
                  alwaysShowLoadMore 
                  hideHiddenFrontPagePosts
                >
                  <Link to={"/allPosts"}>{advancedSortingText}</Link>
                </PostsList2> 
              </AnalyticsContext>}

            </AllowHidingFrontPagePostsContext.Provider>
        </SuspenseWrapper>
        
        {!selectedTabSettings.isInfiniteScroll && <>
          {children}
        </>}
      </SingleColumnSection>
    </AnalyticsContext>
    </AnalyticsInViewTracker>
  )
}

function ContinueReadingTab() {
  const { continueReading } = useContinueReading();
  return <ContinueReadingList continueReading={continueReading} limit={6} shuffle />
}

export default registerComponent("LWHomePosts", LWHomePosts, {
  areEqual: "auto",
});


