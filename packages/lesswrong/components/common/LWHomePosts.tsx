import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Components, capitalize, registerComponent } from '../../lib/vulcan-lib';
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
import { useContinueReading } from '../recommendations/withContinueReading';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { TabRecord } from './TabPicker';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS, RECOMBEE_SETTINGS_COOKIE } from '../../lib/cookies/cookies';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { PostFeedDetails, homepagePostFeedsSetting } from '../../lib/instanceSettings';
import { ObservableQuery, gql, useMutation } from '@apollo/client';
import { vertexEnabledSetting } from '../../lib/publicSettings';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import { useSingle } from '@/lib/crud/withSingle';
import shuffle from 'lodash/shuffle';

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
  loggedOutTagFilterSettingsAlignment: {
    flexDirection: "column",
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
    return true
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
 
const getDefaultTab = (currentUser: UsersCurrent|null, enabledTabs: TabRecord[]) => {
  if (!currentUser) {
    return 'forum-classic'
  }

  //find the tab from the list which tab the property defaultTab set to true
  const defaultTab = enabledTabs.find(tab => tab.defaultTab)?.name ?? 'forum-classic';

  // If the user has a selected tab that is not in the list of enabled tabs, default to the first enabled tab
  if (!!currentUser?.frontpageSelectedTab && !enabledTabs.map(tab => tab.name).includes(currentUser.frontpageSelectedTab)) {
    return defaultTab;
  }

  return currentUser?.frontpageSelectedTab ?? defaultTab;
};

const defaultRecombeeConfig: RecombeeConfiguration = {
  rotationRate: 0.2,
  rotationTime: 24 * 30,
};

function useRecombeeSettings(currentUser: UsersCurrent|null, enabledTabs: TabRecord[]) {
  const [cookies, setCookie] = useCookiesWithConsent();
  const recombeeCookieSettings: RecombeeCookieSettings = cookies[RECOMBEE_SETTINGS_COOKIE] ?? [];
  const [storedActiveScenario, storedActiveScenarioConfig] = recombeeCookieSettings[0] ?? [];
  const [selectedScenario, setSelectedScenario] = useState(storedActiveScenario ?? getDefaultTab(currentUser, enabledTabs));
  const [scenarioConfig, setScenarioConfig] = useState(storedActiveScenarioConfig ?? defaultRecombeeConfig);

  const updateSelectedScenario = (newScenario: string) => {
    // If we don't yet have this cookie, or have this scenario stored in the cookie, add it as the first item
    // Otherwise, reorder the existing scenario + config tuples to have that scenario be first
    const newCookieValue: RecombeeCookieSettings = !recombeeCookieSettings?.find(([scenario]) => newScenario === scenario)
      ? [[newScenario, defaultRecombeeConfig], ...(recombeeCookieSettings ?? [])]
      : [...recombeeCookieSettings].sort((a, b) => a[0] === newScenario ? -1 : 0);
    
    setCookie(RECOMBEE_SETTINGS_COOKIE, JSON.stringify(newCookieValue), { path: '/' });

    const [_, newScenarioConfig] = newCookieValue[0];
    setSelectedScenario(newScenario);
    setScenarioConfig(newScenarioConfig);
  };

  const updateScenarioConfig = (newScenarioConfig: RecombeeConfiguration) => {
    const newCookieValue: RecombeeCookieSettings = [...recombeeCookieSettings];
    newCookieValue[0][1] = newScenarioConfig;
    setCookie(RECOMBEE_SETTINGS_COOKIE, JSON.stringify(newCookieValue), { path: '/' });
    setScenarioConfig(newScenarioConfig);
  };

  useEffect(() => {
    if (recombeeCookieSettings.length === 0) {
      setCookie(RECOMBEE_SETTINGS_COOKIE, JSON.stringify([[getDefaultTab(currentUser, enabledTabs), defaultRecombeeConfig]]), { path: '/' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    selectedScenario, updateSelectedScenario,
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
  const { SettingsButton } = Components;

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
      [classes.hide]: !currentUser,
      [classes.tagFilterSettingsButtonContainerDesktop]: !!currentUser && styleDesktopButton
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

const LWHomePosts = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>}
) => {
  const { SingleColumnSection, PostsList2, TagFilterSettings, RecombeePostsList, CuratedPostsList,
    RecombeePostsListSettings, TabPicker, BookmarksList, ContinueReadingList,
    VertexPostsList, WelcomePostItem, MixedTypeFeed, SuggestedFeedSubscriptions, PostsItem } = Components;

  const { captureEvent } = useTracking();

  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
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
  const enabledTabs = availableTabs
    .filter(feed => !feed.disabled
      && (
        !feed.adminOnly ||
        (userIsAdmin(currentUser) || query.experimentalTabs === 'true') ||
        (feed.name === 'forum-subscribed-authors' && userHasSubscribeTabFeed(currentUser))
      ) 
      && !(feed.name === 'forum-bookmarks' && (currentUser?.bookmarkedPostsMetadata.length ?? 0) < 1)
      && !(feed.name === 'forum-continue-reading' && continueReading?.length < 1)
    )

  const [selectedTab, setSelectedTab] = useState(getDefaultTab(currentUser, enabledTabs));
  const selectedTabSettings = availableTabs.find(t=>t.name===selectedTab)!;

  const { scenarioConfig, updateScenarioConfig } = useRecombeeSettings(currentUser, enabledTabs);

  const handleSwitchTab = (tabName: string) => {
    captureEvent("postFeedSwitched", {
      previousTab: selectedTab,
      newTab: tabName,
    });

    setSelectedTab(tabName);  
    void updateCurrentUser({frontpageSelectedTab: tabName}) // updates persistent user setting
  }

  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  const { filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter } = useFilterSettings();
  const { desktopSettingsVisible, toggleDesktopSettingsVisible } = useDefaultSettingsVisibility(currentUser, 'desktop', selectedTab);
  const { mobileSettingsVisible, toggleMobileSettingsVisible } = useDefaultSettingsVisibility(currentUser, 'mobile', selectedTab);

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
          const deemphasizeCommentsExcludingUserIds = userSubscriptions ? new Set(userSubscriptions.map(({ documentId }) => documentId)) : undefined;
          return <Components.FeedPostCommentsCard
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

  const settingsVisibileClassName = classNames({
    [classes.hideOnDesktop]: !desktopSettingsVisible,
    [classes.hideOnMobile]: !mobileSettingsVisible,
  });

  const filterSettingsElement = (
    <AnalyticsContext pageSectionContext="tagFilterSettings">
      <div className={settingsVisibileClassName}>
        <TagFilterSettings
          filterSettings={filterSettings} 
          setPersonalBlogFilter={setPersonalBlogFilter} 
          setTagFilter={setTagFilter} 
          removeTagFilter={removeTagFilter} 
          flexWrapEndGrow={false}
        />
      </div>
    </AnalyticsContext>
  );

  const { document: subscribedTabAnnouncementPost } = useSingle({
    documentId: '5rygaBBH7B4LNqQkz', 
    collectionName: 'Posts', 
    fragmentName: 'PostsListWithVotes',
    skip: !currentUser || selectedTab !== 'forum-subscribed-authors'
  });

  const subscriptionSettingsElement = (
    <div className={settingsVisibileClassName}>
      <SuggestedFeedSubscriptions
        refetchFeed={refetchSubscriptionContent}
        settingsButton={suggestedUsersSettingsButton}
        existingSubscriptions={userSubscriptions}
      />
      {subscribedTabAnnouncementPost && !subscribedTabAnnouncementPost.isRead && <PostsItem post={subscribedTabAnnouncementPost} className={classes.subscribedAnnouncementPost} />}
    </div>
  );

  const recombeeSettingsElement = (
    <div className={settingsVisibileClassName}>
      {userIsAdmin(currentUser) && <RecombeePostsListSettings settings={scenarioConfig} updateSettings={updateScenarioConfig} />}
    </div>
  );

  let settings = null;
  if (selectedTab === 'forum-classic') { 
    settings = filterSettingsElement;
  } else if (selectedTab === 'forum-subscribed-authors') {
    settings = subscriptionSettingsElement;
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
  };

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
        <div className={classNames(classes.settingsVisibilityControls, {[classes.loggedOutTagFilterSettingsAlignment]: !currentUser})}>
          {!!currentUser && <div className={classes.tabPicker}>
            <TabPicker 
              sortedTabs={enabledTabs} 
              defaultTab={selectedTab} 
              onTabSelectionUpdate={handleSwitchTab}
              showDescriptionOnHover
            />
          </div>}
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
                  showRecommendationIcon
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
                <RecombeePostsList algorithm={'recombee-lesswrong-custom'} settings={scenarioConfig} showRecommendationIcon />
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

const LWHomePostsComponent = registerComponent('LWHomePosts', LWHomePosts, {styles});

declare global {
  interface ComponentTypes {
    LWHomePosts: typeof LWHomePostsComponent
  }
}
