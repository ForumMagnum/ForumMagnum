import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../../lib/filterSettings';
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
import { RECOMBEE_SETTINGS_COOKIE } from '../../lib/cookies/cookies';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { PostFeedDetails, homepagePostFeedsSetting } from '../../lib/instanceSettings';
import { gql, useMutation } from '@apollo/client';
import { vertexEnabledSetting } from '../../lib/publicSettings';

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
      [theme.breakpoints.down('xs')]: {
        padding: "4.5px",
      },  
    },
    [theme.breakpoints.down('sm')]: {
      display: "none",
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
  tagFilterSettingsButton: {
  },
})

export const filterSettingsToggleLabels =  {
  desktopVisible: "Customize (Hide)",
  desktopHidden: "Customize",
  mobileVisible: "Customize (Hide)",
  mobileHidden: "Customize",
}

const advancedSortingText = "Advanced Sorting/Filtering";

const defaultLimit = 13;

const getDefaultDesktopFilterSettingsVisibility = (currentUser: UsersCurrent | null, selectedAlgorithm?: string) => {
  if (!currentUser) {
    return true
  }

  // Hide unless user has explicitly set it to visible
  return currentUser?.hideFrontpageFilterSettingsDesktop === false;
};

const getDefaultTab = (currentUser: UsersCurrent|null, enabledTabs: TabRecord[]) => {
  const defaultTab = homepagePostFeedsSetting.get()[0].name;

  // If the user has a selected tab that is not in the list of enabled tabs, default to the first enabled tab
  if (!!currentUser?.frontpageSelectedTab && !enabledTabs.map(tab => tab.name).includes(currentUser.frontpageSelectedTab)) {
    return defaultTab;
  }

  return currentUser?.frontpageSelectedTab ?? defaultTab;
};

const defaultRecombeeConfig: RecombeeConfiguration = {
  rotationRate: 0.1,
  rotationTime: 12,
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

const LWHomePosts = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { SingleColumnSection, PostsList2, TagFilterSettings, StickiedPosts, RecombeePostsList, CuratedPostsList,
    RecombeePostsListSettings, SettingsButton, TabPicker, ResolverPostsList, BookmarksList, ContinueReadingList,
    VertexPostsList, WelcomePostItem } = Components;

  const { captureEvent } = useTracking() 

  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { query } = useLocation();
  const now = useCurrentTime();
  const { continueReading } = useContinueReading()

  const { count: countBookmarks } = useMulti({
    collectionName: "Posts",
    terms: {
      view: "myBookmarkedPosts",
    },
    fragmentName: "PostsListWithVotes",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });

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
      && !(feed.adminOnly && !userIsAdmin(currentUser))
      && !(feed.name.includes('recombee') && !currentUser)
      && !(feed.name === 'forum-bookmarks' && (countBookmarks ?? 0) < 1)
      && !(feed.name === 'forum-continue-reading' && continueReading?.length < 1)
    )
  const [selectedTab, setSelectedTab] = useState(getDefaultTab(currentUser, enabledTabs));

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
  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  const defaultDesktopFilterSettingsVisibility = getDefaultDesktopFilterSettingsVisibility(currentUser, selectedTab);
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(defaultDesktopFilterSettingsVisibility);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);

  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    
    captureEvent("filterSettingsClicked", {
      settings: filterSettings,
      filterSettingsVisible: filterSettingsVisibleDesktop,
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


  const showSettingsButton = (selectedTab === 'forum-classic') || (userIsAdmin(currentUser) && selectedTab.includes('recombee'));
  const desktopSettingsButtonLabel = filterSettingsVisibleMobile ? 'Hide' : 'Customize'

  const settingsButton = (<>
    {/* Desktop button */}
    <div className={classNames({ [classes.hide]: !currentUser, [classes.tagFilterSettingsButtonContainerDesktop]: !!currentUser })}>
      <SettingsButton
        showIcon={!!currentUser}
        onClick={changeShowTagFilterSettingsDesktop}
      />
    </div>
    {/* Mobile button */}
    <div className={classNames(classes.tagFilterSettingsButtonContainerMobile, { [classes.tagFilterSettingsButtonContainerMobileBackground]: !!currentUser })}>
      <SettingsButton
        label={!currentUser ? desktopSettingsButtonLabel : undefined}
        showIcon={!!currentUser}
        onClick={() => {
          setFilterSettingsVisibleMobile(!filterSettingsVisibleMobile)
          captureEvent("filterSettingsClicked", {
            settingsVisible: !filterSettingsVisibleMobile,
            settings: filterSettings,
            pageSectionContext: "latestPosts",
            mobile: true
          })
        }} />
      </div>
  </>);


  let settings = null;

  if (selectedTab === 'forum-classic') { 
    settings = <AnalyticsContext pageSectionContext="tagFilterSettings">
      <div className={classNames({
        [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
        [classes.hideOnMobile]: !filterSettingsVisibleMobile,
      })}>
        <TagFilterSettings
          filterSettings={filterSettings} 
          setPersonalBlogFilter={setPersonalBlogFilter} 
          setTagFilter={setTagFilter} 
          removeTagFilter={removeTagFilter} 
          flexWrapEndGrow={false}
        />
      </div>
    </AnalyticsContext>
  } else if (selectedTab.includes('recombee')) {
    settings = <div className={classNames({
      [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
      [classes.hideOnMobile]: !filterSettingsVisibleMobile,
    })}>
      {userIsAdmin(currentUser) && <RecombeePostsListSettings settings={scenarioConfig} updateSettings={updateScenarioConfig} />}
    </div>
  }

  const limit = parseInt(query.limit) || defaultLimit;
  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get(), 'days').startOf('hour').toISOString();

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
          {showSettingsButton && settingsButton}
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
                <ResolverPostsList
                  resolverName="PostsBySubscribedAuthors"
                  limit={13}
                  fallbackText="Visits users' profile pages to subscribe to their posts and comments."
                  showLoadMore
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
