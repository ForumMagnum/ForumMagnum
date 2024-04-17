import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking, useTracking } from '../../lib/analyticsEvents';
import { FilterSettings, useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { isEAForum, isLW, isLWorAF, taggingNamePluralSetting, taggingNameSetting} from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useMulti } from '../../lib/crud/withMulti';
import { useContinueReading } from '../recommendations/withContinueReading';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { TabRecord } from './TabPicker';
import { postFeedsProductionSetting, postFeedsTestingSetting } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { FRONTPAGE_TAB_SETTINGS_COOKIE } from '../../lib/cookies/cookies';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';

// Key is the algorithm/tab name
type FrontpageTabCookieSettings = [string, RecombeeConfiguration][];

const styles = (theme: ThemeType): JssStyles => ({
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
    gap: "4px",
    marginBottom: "8px",
    justifyContent: "space-between",
    alignItems: "center",
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

const getDefaultTab = () => {
  return postFeedsProductionSetting.get()[0].name;
};

const defaultTabConfig: RecombeeConfiguration = {
  rotationRate: 0.1,
  rotationTime: 12,
};

function useFrontpageTabSettings() {
  const [cookies, setCookie] = useCookiesWithConsent();
  const frontpageTabsCookieSettings: FrontpageTabCookieSettings = cookies[FRONTPAGE_TAB_SETTINGS_COOKIE] ?? [];
  const [storedActiveTab, storedActiveTabConfig] = frontpageTabsCookieSettings[0] ?? [];
  const [selectedTab, setSelectedTab] = useState(storedActiveTab ?? getDefaultTab());
  const [tabConfig, setTabConfig] = useState(storedActiveTabConfig ?? defaultTabConfig);

  const updateSelectedTab = (newTab: string) => {
    // If we don't yet have this cookie, or have this tab stored in the cookie, add it as the first item
    // Otherwise, reorder the existing tab + config tuples to have that tab be first
    const newCookieValue: FrontpageTabCookieSettings = !frontpageTabsCookieSettings?.find(([tab]) => newTab === tab)
      ? [[newTab, defaultTabConfig], ...(frontpageTabsCookieSettings ?? [])]
      : [...frontpageTabsCookieSettings].sort((a, b) => a[0] === newTab ? -1 : 0);
    
    setCookie(FRONTPAGE_TAB_SETTINGS_COOKIE, JSON.stringify(newCookieValue), { path: '/' });

    const [_, newTabConfig] = newCookieValue[0];
    setSelectedTab(newTab);
    setTabConfig(newTabConfig);
  };

  const updateTabConfig = (newTabConfig: RecombeeConfiguration) => {
    const newCookieValue: FrontpageTabCookieSettings = [...frontpageTabsCookieSettings];
    newCookieValue[0][1] = newTabConfig;
    setCookie(FRONTPAGE_TAB_SETTINGS_COOKIE, JSON.stringify(newCookieValue), { path: '/' });
    setTabConfig(newTabConfig);
  };

  useEffect(() => {
    if (frontpageTabsCookieSettings.length === 0) {
      setCookie(FRONTPAGE_TAB_SETTINGS_COOKIE, JSON.stringify([[getDefaultTab(), defaultTabConfig]]), { path: '/' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    selectedTab, updateSelectedTab,
    tabConfig, updateTabConfig
  };
}

const LWHomePosts = ({classes}: {classes: ClassesType}) => {
  const { SingleColumnSection, PostsList2, TagFilterSettings, StickiedPosts, RecombeePostsList, CuratedPostsList,
    RecombeePostsListSettings, SettingsButton, TabPicker, ResolverPostsList, BookmarksList, ContinueReadingList } = Components;

  const { captureEvent } = useTracking() 

  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { query } = useLocation();
  const { timezone } = useTimezone();
  const now = useCurrentTime();
  const { continueReading } = useContinueReading()


  const { selectedTab, updateSelectedTab, tabConfig, updateTabConfig } = useFrontpageTabSettings();

  const { count: countBookmarks } = useMulti({
    collectionName: "Posts",
    terms: {
      view: "myBookmarkedPosts",
    },
    fragmentName: "PostsListWithVotes",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });

  const availableAlgorithms: TabRecord[] = postFeedsProductionSetting.get().map(feed => ({ name: feed.name, label: feed.label, description: feed.description, disabled: feed.disabled }));
  if (userIsAdmin(currentUser)) {
    const testingFeeds = postFeedsTestingSetting.get().map(feed => ({ name: feed.name, label: feed.label, description: feed.description, disabled: feed.disabled }));
    availableAlgorithms.push(...testingFeeds);
  }

  const enabledAlgorithms = availableAlgorithms
    .filter(feed => !feed.disabled
      && !(feed.name === 'lesswrong-bookmarks' && (countBookmarks ?? 0) < 1)
      && !(feed.name === 'lesswrong-continue-reading' && continueReading?.length < 1)
    )


  const handleSwitchTab = (tabName: string) => {
    captureEvent("postFeedSwitched", {
      previousTab: selectedTab,
      newTab: tabName,
    });
    updateSelectedTab(tabName);
  }

  console.log({selectedTab, availableAlgorithms, enabledAlgorithms })

  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum/FriendlyUI it always starts out hidden)
  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  const defaultDesktopFilterSettingsVisibility = getDefaultDesktopFilterSettingsVisibility(currentUser, selectedTab);
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(defaultDesktopFilterSettingsVisibility);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);

  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    if (isLWorAF) {
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    }
    
    captureEvent("filterSettingsClicked", {
      settings: filterSettings,
      filterSettingsVisible: filterSettingsVisibleDesktop,
      pageSectionContext: "HomePosts",
    })
  };


  const showSettingsButton = (selectedTab === 'lesswrong-classic') || (userIsAdmin(currentUser) && selectedTab.includes('recombee')) ;

  const settingsButton = (<div>
    <SettingsButton
      className={classes.hideOnMobile}
      label={filterSettingsVisibleDesktop ?
        filterSettingsToggleLabels.desktopVisible :
        filterSettingsToggleLabels.desktopHidden}
      showIcon={false}
      onClick={changeShowTagFilterSettingsDesktop}
    />
    <SettingsButton
      className={classes.hideOnDesktop}
      label={filterSettingsVisibleMobile ?
        filterSettingsToggleLabels.mobileVisible :
        filterSettingsToggleLabels.mobileHidden}
      showIcon={false}
      onClick={() => {
        setFilterSettingsVisibleMobile(!filterSettingsVisibleMobile)
        captureEvent("filterSettingsClicked", {
          settingsVisible: !filterSettingsVisibleMobile,
          settings: filterSettings,
          pageSectionContext: "latestPosts",
          mobile: true
        })
      }} />
  </div>);


  let settings = null;

  if (selectedTab === 'lesswrong-classic') { 
    settings = <AnalyticsContext pageSectionContext="tagFilterSettings">
      <div className={classNames({
        [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
        [classes.hideOnMobile]: !filterSettingsVisibleMobile,
      })}>
        <TagFilterSettings
          filterSettings={filterSettings} setPersonalBlogFilter={setPersonalBlogFilter} setTagFilter={setTagFilter} removeTagFilter={removeTagFilter}
        />
      </div>
    </AnalyticsContext>
  } else if (selectedTab.includes('recombee')) {
    settings = <div className={classNames({
      [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
      [classes.hideOnMobile]: !filterSettingsVisibleMobile,
    })}>
      {userIsAdmin(currentUser) && <RecombeePostsListSettings settings={tabConfig} updateSettings={updateTabConfig} />}
    </div>
  }


  const limit = parseInt(query.limit) || defaultLimit;
  const dateCutoff = moment(now).tz(timezone).subtract(frontpageDaysAgoCutoffSetting.get(), 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  };

  return (
    // TODO: do we need capturePostItemOnMount here?
    <AnalyticsContext pageSectionContext="postsFeed">
      <SingleColumnSection>
        <div className={classes.settingsVisibilityControls}>
          <TabPicker 
            sortedTabs={enabledAlgorithms} 
            defaultTab={selectedTab} 
            onTabSelectionUpdate={handleSwitchTab}
            showDescriptionOnHover
          />
          {showSettingsButton && settingsButton}
        </div>
        {settings}
        {isFriendlyUI && <StickiedPosts />}
        {/* TODO: reenable, disabled for testing to see how often duplication happens */}
        <HideRepeatedPostsProvider>
          <AnalyticsContext listContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>

              {/* LATEST POSTS (Hacker News Algorithm) */}
              {(selectedTab === 'lesswrong-classic') && <AnalyticsContext feedType={selectedTab}>
                <CuratedPostsList />
                <PostsList2 
                  terms={recentPostsTerms} 
                  alwaysShowLoadMore 
                  hideHiddenFrontPagePosts
                >
                  <Link to={"/allPosts"}>{advancedSortingText}</Link>
                </PostsList2> 
              </AnalyticsContext>}
              
              {/* RECOMBEE RECOMMENDATIONS */}
              {selectedTab.includes('recombee') && <AnalyticsContext feedType={selectedTab}>
                <RecombeePostsList algorithm={selectedTab} settings={tabConfig} />
              </AnalyticsContext>}

              {/* BOOKMARKS */}
              {(selectedTab === 'lesswrong-bookmarks') && <AnalyticsContext feedType={selectedTab}>
                <BookmarksList showMessageIfEmpty={true} limit={13} />
              </AnalyticsContext>}
              
              {/* CONTINUE READING */}
              {(selectedTab === 'lesswrong-continue-reading') && (continueReading?.length > 0) && <AnalyticsContext feedType={selectedTab}>
                <ContinueReadingList continueReading={continueReading}/>
              </AnalyticsContext>}

              {/* SUBSCRIBED */}
              {(selectedTab === 'lesswrong-subscribed-authors') && <AnalyticsContext feedType={selectedTab}>
                <ResolverPostsList
                  resolverName="PostsBySubscribedAuthors"
                  limit={13}
                  fallbackText="Visits users' profile pages to subscribe to their posts and comments."
                  showLoadMore
                />
               </AnalyticsContext>}

              {/* CHRONOLIGCAL FEED */}
              {(selectedTab === 'lesswrong-chronological') && <AnalyticsContext feedType={selectedTab}>
                <PostsList2 
                  terms={{...recentPostsTerms, view: "new"}} 
                  alwaysShowLoadMore 
                  hideHiddenFrontPagePosts
                >
                  <Link to={"/allPosts"}>{advancedSortingText}</Link>
                </PostsList2> 
              </AnalyticsContext>}

            </AllowHidingFrontPagePostsContext.Provider>
          </AnalyticsContext>
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
