import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { FilterSettings, useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { isEAForum, isLW, isLWorAF } from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { isFriendlyUI } from '../../themes/forumTheme';
import { EA_FORUM_TRANSLATION_TOPIC_ID } from '../../lib/collections/tags/collection';
import type { Option } from '../common/InlineSelect';
import { getPostViewOptions } from '../../lib/PostViewOptions';
import qs from 'qs'

const titleWrapper = isLW ? {
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
  icon: {
    cursor: "pointer",
    color: theme.palette.grey[600],
    fontSize: 18,
    position: 'relative',
    top: '4px',
  },
  iconWithLabelGroup: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  sortMenuContainer: {
    fontSize: "1.1rem",
    fontWeight: "450",
    lineHeight: "1.5em",
    fontFamily: theme.palette.fonts.sansSerifStack,
  }
})

const advancedSortingText = isFriendlyUI
  ? "Advanced sorting & filtering"
  : "Advanced Sorting/Filtering";

const defaultLimit = isFriendlyUI ? 11 : 13;

const applyConstantFilters = (filterSettings: FilterSettings): FilterSettings => {
  if (!isEAForum) {
    return filterSettings;
  }
  const tags = filterSettings.tags.filter(
    ({tagId}) => tagId !== EA_FORUM_TRANSLATION_TOPIC_ID,
  );
  tags.push({
    tagId: EA_FORUM_TRANSLATION_TOPIC_ID,
    tagName: "Translation",
    filterMode: "Hidden",
  });
  return {
    ...filterSettings,
    tags,
  };
}

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const location = useLocation();
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();

  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum/FriendlyUI it always starts out hidden)
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(isFriendlyUI ? false : !currentUser?.hideFrontpageFilterSettingsDesktop);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible: filterSettingsVisibleDesktop, pageSectionContext: "latestPosts"}, captureOnMount: true})
  const { query } = location;
  const {
    SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton,
    CuratedPostsList, SectionTitle, StickiedPosts, Typography, InlineSelect
  } = Components
  const { history } = useNavigation();

  const limit = parseInt(query.limit) || defaultLimit;

  const now = useCurrentTime();
  const dateCutoff = moment(now).tz(timezone).subtract(frontpageDaysAgoCutoffSetting.get(), 'days').format("YYYY-MM-DD");

  const currentSorting = (query.view || currentUser?.allPostsSorting || 'magic') as PostSortingMode;
  const viewOptions = getPostViewOptions();
  const selectedOption = viewOptions.find((option) => option.value === query.view) || viewOptions[0]

  const handleViewClick = (opt: Option & {value: CommentsViewName}) => {
    const view = opt.value
    const { query } = location;
    const newQuery = {...query, view: view}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  const recentPostsTerms = {
    ...query,
    filterSettings: applyConstantFilters(filterSettings),
    after: dateCutoff,
    view: currentSorting,
    forum: true,
    limit:limit,
  }

  const showCurated = isFriendlyUI || (isLW && reviewIsActive())

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <Typography
          variant="body2"
          component='span'
          className={classes.inline}
        >
          Sorted by <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleViewClick} />
        </Typography>
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
        {isFriendlyUI && <StickiedPosts />}
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
