import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import {forumTypeSetting, taggingNamePluralSetting, taggingNameSetting} from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import { forumSelect } from '../../lib/forumTypeUtils';
import { useABTest } from '../../lib/abTestImpl';
import { slowerFrontpageABTest } from '../../lib/abTests';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';

const isEAForum = forumTypeSetting.get() === 'EAForum';

const titleWrapper = forumTypeSetting.get() === 'LessWrong' ? {
  marginBottom: 8
} : {
  display: "flex",
  marginBottom: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const styles = (theme: ThemeType): JssStyles => ({
  titleWrapper,
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
})

const latestPostsName = forumTypeSetting.get() === 'EAForum' ? 'New & upvoted' : 'Latest Posts'

const filterSettingsToggleLabels = forumSelect({
  EAForum: {
    desktopVisible: "Customize feed",
    desktopHidden: "Customize feed",
    mobileVisible: "Customize feed",
    mobileHidden: "Customize feed",
  },
  default: {
    desktopVisible: "Customize Feed (Hide)",
    desktopHidden: "Customize Feed",
    mobileVisible: "Customize Feed (Hide)",
    mobileHidden: "Customize Feed (Show)",
  }
})

const advancedSortingText = isEAForum
  ? "Advanced sorting & filtering"
  : "Advanced Sorting/Filtering";

const defaultLimit = isEAForum ? 11 : 13;

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const location = useLocation();
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();
  // required for side-effect of including this in analytics events
  const abTestGroup = useABTest(slowerFrontpageABTest);

  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum it always starts out hidden)
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(isEAForum ? false : !currentUser?.hideFrontpageFilterSettingsDesktop);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible: filterSettingsVisibleDesktop, pageSectionContext: "latestPosts"}, captureOnMount: true})
  const { query } = location;
  const {
    SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton,
    CuratedPostsList, SectionTitle, StickiedPosts
  } = Components
  const limit = parseInt(query.limit) || defaultLimit;

  const now = useCurrentTime();
  const dateCutoff = moment(now).tz(timezone).subtract(frontpageDaysAgoCutoffSetting.get(), 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  }
  
  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    if (!isEAForum) {
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    }
    
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisibleDesktop,
      settings: filterSettings,
    })
  }

  const showCurated = isEAForum || (forumTypeSetting.get() === "LessWrong" && reviewIsActive())

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={latestPostsName} noTopMargin={isEAForum} noBottomPadding>
          <LWTooltip
            title={`Use these buttons to increase or decrease the visibility of posts based on ${taggingNameSetting.get()}. Use the "+" button at the end to add additional ${taggingNamePluralSetting.get()} to boost or reduce them.`}
            hideOnTouchScreens
          >
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
                  pageSectionContext: "latestPosts"
                })
              }} />
          </LWTooltip>
        </SectionTitle>
  
        <AnalyticsContext pageSectionContext="tagFilterSettings">
          <div className={classNames({
            [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
            [classes.hideOnMobile]: !filterSettingsVisibleMobile,
          })}>
            <TagFilterSettings
              filterSettings={filterSettings} setPersonalBlogFilter={setPersonalBlogFilter} setTagFilter={setTagFilter} removeTagFilter={removeTagFilter}
            />
          </div>
        </AnalyticsContext>
        {isEAForum && <StickiedPosts />}
        <HideRepeatedPostsProvider>
          {showCurated && <CuratedPostsList />}
          <AnalyticsContext listContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              <PostsList2
                terms={recentPostsTerms}
                alwaysShowLoadMore
                hideHiddenFrontPagePosts
              >
                <Link to={"/allPosts"}>{advancedSortingText}</Link>
              </PostsList2>
            </AllowHidingFrontPagePostsContext.Provider>
          </AnalyticsContext>
        </HideRepeatedPostsProvider>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts, {styles});

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
