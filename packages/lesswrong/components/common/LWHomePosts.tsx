import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useMulti } from '../../lib/crud/withMulti';
import { ContinueReading, useContinueReading } from '../recommendations/withContinueReading';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { TabRecord, TabPicker } from './TabPicker';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS, LAST_VISITED_FRONTPAGE_COOKIE, RECOMBEE_SETTINGS_COOKIE, SELECTED_FRONTPAGE_TAB_COOKIE } from '../../lib/cookies/cookies';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { PostFeedDetails, homepagePostFeedsSetting } from '../../lib/instanceSettings';
import { ObservableQuery, gql, useMutation } from '@apollo/client';
import { vertexEnabledSetting } from '../../lib/publicSettings';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import { useSingle } from '@/lib/crud/withSingle';
import { isServer } from '@/lib/executionEnvironment';
import isEqual from 'lodash/isEqual';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { capitalize } from "../../lib/vulcan-lib/utils";
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { FeedPostCommentsCard } from "../recentDiscussion/FeedPostCommentsCard";
import { SettingsButton } from "../icons/SettingsButton";
import { SingleColumnSection } from "./SingleColumnSection";
import { PostsList2 } from "../posts/PostsList2";
import { TagFilterSettings } from "../tagging/TagFilterSettings";
import { RecombeePostsList } from "../posts/RecombeePostsList";
import { CuratedPostsList } from "../recommendations/CuratedPostsList";
import { RecombeePostsListSettings } from "../posts/RecombeePostsListSettings";
import { BookmarksList } from "../bookmarks/BookmarksList";
import { ContinueReadingList } from "../recommendations/ContinueReadingList";
import { VertexPostsList } from "../posts/VertexPostsList";
import { WelcomePostItem } from "../recommendations/WelcomePostItem";
import { MixedTypeFeed } from "./MixedTypeFeed";
import { SuggestedFeedSubscriptions } from "../subscriptions/SuggestedFeedSubscriptions";
import { PostsItem } from "../posts/PostsItem";

// Key is the algorithm/tab name
type RecombeeCookieSettings = [string, RecombeeConfiguration][];

const styles = (theme: ThemeType) => ({
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
      background: theme.palette.panelBackground.default,
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
  enrichedTagFilterNotice: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.slightlyDim2,
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 3,
  },
});

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
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS]);
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(
    platform === 'mobile'
      ? false
      : getDefaultDesktopFilterSettingsVisibility(currentUser)
  );

  const subscriptionSettingsVisibleCookie = cookies[HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS];
  const [subscriptionSettingsVisible, setSubscriptionSettingsVisible] = useState(subscriptionSettingsVisibleCookie !== 'true');

  const settingsVisible = useMemo(() => (
    selectedAlgorithm === 'forum-subscribed-authors'
      ? subscriptionSettingsVisible
      : filterSettingsVisible
  ), [filterSettingsVisible, subscriptionSettingsVisible, selectedAlgorithm]);

  const toggleSettingsVisible = useCallback((newVisibilityState: boolean) => {
    if (selectedAlgorithm === 'forum-subscribed-authors') {
      setCookie(HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS, !newVisibilityState ? 'true' : 'false');
      setSubscriptionSettingsVisible(newVisibilityState);
    } else {
      setFilterSettingsVisible(newVisibilityState);
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: !newVisibilityState})
    }
  }, [selectedAlgorithm, setCookie, updateCurrentUser]);

  return {
    [`${platform}SettingsVisible`]: settingsVisible,
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
  continueReading: ContinueReading[]
): boolean {
  if (tab.disabled) {
    return false;
  }

  const isUserLoggedIn = !!currentUser;
  const isAdminOrExperimental = userIsAdmin(currentUser) || query.experimentalTabs === 'true';
  const enabledForLoggedInUsers = !tab.adminOnly || isAdminOrExperimental;
  const enabledForLoggedOutUsers = !!tab.showToLoggedOut;

  const enabledForCurrentUser = (isUserLoggedIn && enabledForLoggedInUsers) || enabledForLoggedOutUsers;

  const activeSubscribedTabDisabled = tab.name === 'forum-subscribed-authors' && !userHasSubscribeTabFeed(currentUser);

  const hasBookmarks = (currentUser?.bookmarkedPostsMetadata.length ?? 0) >= 1;
  const activeBookmarkTabDisabled = tab.name === 'forum-bookmarks' && !hasBookmarks;

  const hasContinueReading = (continueReading?.length ?? 0) >= 1;
  const activeContinueReadingTabDisabled = tab.name === 'forum-continue-reading' && !hasContinueReading;

  return enabledForCurrentUser && !activeSubscribedTabDisabled && !activeBookmarkTabDisabled && !activeContinueReadingTabDisabled;
}

const defaultRecombeeConfig: RecombeeConfiguration = {
  rotationRate: 0.2,
  rotationTime: 24 * 30,
};

function useRecombeeSettings(currentUser: UsersCurrent|null, enabledTabs: TabRecord[], filterSettings: FilterSettings) {
  const [cookies, setCookie] = useCookiesWithConsent();
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
  classes
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
  classes: ClassesType<typeof styles>;
}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();

  const getSettingsIconOverride = (selectedTab: string, settingsVisible: boolean) => {
    if (selectedTab !== 'forum-subscribed-authors') {
      return undefined
    }
    return settingsVisible ? 'up' : 'down'
  };

  const desktopConfiguration = labelOverride ? {
    showIcon: false,
    label: labelOverride(desktopSettingsVisible)
  } : {
    showIcon: !!currentUser,
    useArrow: getSettingsIconOverride(selectedTab, desktopSettingsVisible)
  } as const;

  const mobileConfiguration = labelOverride ? {
    showIcon: false,
    label: labelOverride(mobileSettingsVisible)
  } : {
    showIcon: !!currentUser,
    useArrow: getSettingsIconOverride(selectedTab, mobileSettingsVisible),
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

const LWHomePostsInner = ({ children, classes }: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>}
) => {
  const { captureEvent } = useTracking();

  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const now = useCurrentTime();
  const { continueReading } = useContinueReading();

  const [sendVertexViewHomePageEvent] = useMutation(gql`
    mutation sendVertexViewHomePageEventMutation {
      sendVertexViewHomePageEvent
    }
  `, {
    ignoreResults: true
  });

  const availableTabs: PostFeedDetails[] = homepagePostFeedsSetting.get()
  const enabledTabs = availableTabs.filter(tab => isTabEnabled(tab, currentUser, query, continueReading));

  const [selectedTab, setSelectedTab] = useSelectedTab(currentUser, enabledTabs);
  const selectedTabSettings = availableTabs.find(t=>t.name===selectedTab)!;

  
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  const { filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter } = useFilterSettings();
  const { desktopSettingsVisible, toggleDesktopSettingsVisible } = useDefaultSettingsVisibility(currentUser, 'desktop', selectedTab);
  const { mobileSettingsVisible, toggleMobileSettingsVisible } = useDefaultSettingsVisibility(currentUser, 'mobile', selectedTab);
  
  const { scenarioConfig, updateScenarioConfig } = useRecombeeSettings(currentUser, enabledTabs, filterSettings);

  const changeShowTagFilterSettingsDesktop = () => {
    toggleDesktopSettingsVisible(!desktopSettingsVisible);
    
    captureEvent("filterSettingsClicked", {
      settings: filterSettings,
      filterSettingsVisible: desktopSettingsVisible,
      pageSectionContext: "HomePosts",
    })
  };

  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);
  const refetchSubscriptionContent = useCallback(() => {
    if (refetchSubscriptionContentRef.current) {
      void refetchSubscriptionContentRef.current();
    }
  }, [refetchSubscriptionContentRef]);

  // TODO: refactor to pass this through SuggestedFeedSubscriptions > FollowUserSearch instead of calling it there, if we keep it here
  const { results: userSubscriptions } = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: "Users",
      subscriptionType: "newActivityForFeed",
      limit: 1000
    },
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
    skip: !currentUser || selectedTab !== 'forum-subscribed-authors'
  });

  const subscribedFeedProps = {
    resolverName: 'SubscribedFeed',
    firstPageSize: 10,
    pageSize: 20,
    sortKeyType: 'Date',
    reorderOnRefetch: true,
    renderers: {
      postCommented: {
        fragmentName: "SubscribedPostAndCommentsFeed",
        render: (postCommented: SubscribedPostAndCommentsFeed) => {
          const expandOnlyCommentIds = postCommented.expandCommentIds ? new Set<string>(postCommented.expandCommentIds) : undefined;
          const deemphasizeCommentsExcludingUserIds = userSubscriptions ? new Set(filterNonnull(userSubscriptions.map(({ documentId }) => documentId))) : undefined;
          return <FeedPostCommentsCard
            key={postCommented.post._id}
            post={postCommented.post}
            comments={postCommented.comments}
            maxCollapsedLengthWords={postCommented.postIsFromSubscribedUser ? 200 : 50}
            refetch={() => {} /* TODO */}
            commentTreeOptions={{ expandOnlyCommentIds, deemphasizeCommentsExcludingUserIds }}
          />
        },
      }
    }
  } as const;

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
    selectedTab === 'forum-subscribed-authors' ||
    selectedTab === 'recombee-hybrid' ||
    (userIsAdmin(currentUser) && selectedTab.includes('recombee'))
  );

  const mobileSettingsButtonLabel = mobileSettingsVisible ? 'Hide' : 'Customize'

  const settingsButtonProps = { selectedTab, changeShowTagFilterSettingsDesktop, desktopSettingsVisible, mobileSettingsVisible, mobileSettingsButtonLabel, filterSettings, classes };

  const inlineTabSettingsButton = <FrontpageSettingsButton
    {...settingsButtonProps}
    toggleMobileSettingsVisible={toggleMobileSettingsVisible}
  />;
  // We don't want to show the "hide" button on mobile inside of the suggested users container, so we pass it in manually for the tab-level settings button above
  const suggestedUsersSettingsButton = <FrontpageSettingsButton
    {...settingsButtonProps}
    styleDesktopButton={false}
    labelOverride={(settingsVisible) => settingsVisible ? 'Hide' : 'Show'}
    labelClassName={classes.suggestedUsersHideLabel}
  />;

  const settingsPotentiallyVisible = desktopSettingsVisible || mobileSettingsVisible;
  const settingsVisibileClassName = classNames({
    [classes.hideOnDesktop]: !desktopSettingsVisible,
    [classes.hideOnMobile]: !mobileSettingsVisible,
  });

  // TODO: Make this also work for logged out users
  const currentFilterSettings = currentUser?.frontpageFilterSettings
  const hasSetAnyFilters = currentFilterSettings === undefined ? false : true;

  const filterSettingsElement = (
    <AnalyticsContext pageSectionContext="tagFilterSettings">
      {settingsPotentiallyVisible && <div className={settingsVisibileClassName}>
        <TagFilterSettings
          filterSettings={filterSettings} 
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

  const { document: subscribedTabAnnouncementPost } = useSingle({
    documentId: '5rygaBBH7B4LNqQkz', 
    collectionName: 'Posts', 
    fragmentName: 'PostsListWithVotes',
    skip: !currentUser || selectedTab !== 'forum-subscribed-authors'
  });

  const subscriptionSettingsElement = <>
    {settingsPotentiallyVisible && <div className={settingsVisibileClassName}>
      <SuggestedFeedSubscriptions
        refetchFeed={refetchSubscriptionContent}
        settingsButton={suggestedUsersSettingsButton}
        existingSubscriptions={userSubscriptions}
      />
      {subscribedTabAnnouncementPost && !subscribedTabAnnouncementPost.isRead && <PostsItem post={subscribedTabAnnouncementPost} className={classes.subscribedAnnouncementPost} />}
    </div>}
  </>;

  const recombeeSettingsElement = <>
    {settingsPotentiallyVisible && <div className={settingsVisibileClassName}>
      {userIsAdmin(currentUser) && <RecombeePostsListSettings settings={scenarioConfig} updateSettings={updateScenarioConfig} />}
    </div>}
  </>;

  let settings = null;
  if (selectedTab === 'forum-classic') { 
    settings = filterSettingsElement;
  } else if (selectedTab === 'forum-subscribed-authors') {
    settings = subscriptionSettingsElement;
  } else if (selectedTab === 'recombee-hybrid') {
    settings = filterSettingsElement;
  } else if (selectedTab.includes('recombee')) {
    settings = recombeeSettingsElement;
  }

  const limit = parseInt(query.limit) || defaultLimit;
  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get()*24, 'hours').startOf('hour').toISOString();

  const recentPostsTerms = {
    ...query,
    filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  } as const;

  useEffect(() => {
    if (currentUser && vertexEnabledSetting.get()) {
      void sendVertexViewHomePageEvent();
    }
    // We explicitly only want to send it once on page load, no matter what changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // TODO: do we need capturePostItemOnMount here?
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
        {/* TODO: reenable, disabled for testing to see how often duplication happens */}
        <HideRepeatedPostsProvider>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>

              {/* LATEST POSTS (Hacker News Algorithm) */}
              {/* Frustratingly, the AnalyticsContext update doesn't update upon switching tab so it's necessary to have a wrapper around each section individually, could be investigated further */}
              {(selectedTab === 'forum-classic') && <AnalyticsContext feedType={selectedTab}>
                <WelcomePostItem />
                <CuratedPostsList overrideLimit={2}/>
                <PostsList2 
                  terms={recentPostsTerms} 
                  alwaysShowLoadMore 
                  hideHiddenFrontPagePosts
                >
                  <Link to={"/allPosts"}>{advancedSortingText}</Link>
                </PostsList2> 
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

              {/* VERTEX RECOMMENDATIONS */}
              {selectedTab.startsWith('vertex-') && <AnalyticsContext feedType={selectedTab}>
                <VertexPostsList />  
              </AnalyticsContext>}

              {/* BOOKMARKS */}
              {(selectedTab === 'forum-bookmarks') && <AnalyticsContext feedType={selectedTab}>
                <BookmarksList showMessageIfEmpty={true} limit={13} />
              </AnalyticsContext>}
              
              {/* CONTINUE READING */}
              {(selectedTab === 'forum-continue-reading') && (continueReading?.length > 0) && <AnalyticsContext feedType={selectedTab}>
                <ContinueReadingList continueReading={continueReading} limit={6} shuffle />
              </AnalyticsContext>}

              {/* SUBSCRIBED */}
              {(selectedTab === 'forum-subscribed-authors') && <AnalyticsContext feedType={selectedTab}>
                <MixedTypeFeed
                  refetchRef={refetchSubscriptionContentRef}
                  {...subscribedFeedProps}
                />
               </AnalyticsContext>}

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
        </HideRepeatedPostsProvider>
        
        {!selectedTabSettings.isInfiniteScroll && <>
          {children}
        </>}
      </SingleColumnSection>
    </AnalyticsContext>
  )


}

export const LWHomePosts = registerComponent('LWHomePosts', LWHomePostsInner, {styles});

declare global {
  interface ComponentTypes {
    LWHomePosts: typeof LWHomePosts
  }
}
