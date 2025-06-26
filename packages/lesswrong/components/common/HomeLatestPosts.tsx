import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { FilterSettings, useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { isEAForum, isLW, isLWorAF, taggingNamePluralSetting, taggingNameSetting} from '../../lib/instanceSettings';
import SectionTitle, { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import { forumSelect } from '../../lib/forumTypeUtils';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { isFriendlyUI } from '../../themes/forumTheme';
import { EA_FORUM_TRANSLATION_TOPIC_ID } from '../../lib/collections/tags/helpers';
import { useCurrentFrontpageSurvey } from '../hooks/useCurrentFrontpageSurvey';
import SingleColumnSection from "./SingleColumnSection";
import PostsList2 from "../posts/PostsList2";
import TagFilterSettings from "../tagging/TagFilterSettings";
import LWTooltip from "./LWTooltip";
import SettingsButton from "../icons/SettingsButton";
import CuratedPostsList from "../recommendations/CuratedPostsList";
import StickiedPosts from "../ea-forum/StickiedPosts";
import PostsListViewToggle from "../posts/PostsListViewToggle";
import SurveyPostsItem from "../surveys/SurveyPostsItem";

const titleWrapper = isLWorAF ? {
  marginBottom: 8
} : {
  display: "flex",
  marginBottom: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const styles = (theme: ThemeType) => ({
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
  postsListSettings: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
});

const latestPostsName = isFriendlyUI ? 'New & upvoted' : 'Latest Posts'

export const filterSettingsToggleLabels = forumSelect({
  EAForum: {
    desktopVisible: "Customize feed",
    desktopHidden: "Customize feed",
    mobileVisible: "Customize feed",
    mobileHidden: "Customize feed",
  },
  default: {
    desktopVisible: "Customize (Hide)",
    desktopHidden: "Customize",
    mobileVisible: "Customize (Hide)",
    mobileHidden: "Customize",
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

const HomeLatestPosts = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const location = useLocation();
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();

  const {filterSettings, suggestedTagsQueryRef, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum/FriendlyUI it always starts out hidden)
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(isFriendlyUI ? false : !currentUser?.hideFrontpageFilterSettingsDesktop);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);
  const { captureEvent } = useOnMountTracking({
    eventType:"frontpageFilterSettings",
    eventProps: {
      filterSettings,
      filterSettingsVisible: filterSettingsVisibleDesktop,
      pageSectionContext: "latestPosts"
    },
    captureOnMount: true,
  })
  const { query } = location;
  const limit = parseInt(query.limit) || defaultLimit;

  const now = useCurrentTime();
  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get()*24, 'hours').startOf('hour').toISOString()

  const recentPostsTerms = {
    ...query,
    filterSettings: applyConstantFilters(filterSettings),
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  } as const;
  
  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    if (isLWorAF) {
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    }
    
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisibleDesktop,
      settings: filterSettings,
    })
  }

  const showCurated = isFriendlyUI || (isLW && reviewIsActive())

  const {survey, refetch: refetchSurvey} = useCurrentFrontpageSurvey();

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={latestPostsName} noTopMargin={isFriendlyUI} noBottomPadding>
          <div className={classes.postsListSettings}>
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
                textShadow={isLWorAF}
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
            {isFriendlyUI && <PostsListViewToggle />}
          </div>
        </SectionTitle>

        <AnalyticsContext pageSectionContext="tagFilterSettings">
          {(filterSettingsVisibleDesktop || filterSettingsVisibleMobile) && (
            <div className={classNames({
              [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
              [classes.hideOnMobile]: !filterSettingsVisibleMobile,
            })}>
              <TagFilterSettings
                filterSettings={filterSettings}
                suggestedTagsQueryRef={suggestedTagsQueryRef}
                setPersonalBlogFilter={setPersonalBlogFilter}
                setTagFilter={setTagFilter}
                removeTagFilter={removeTagFilter}
              />
            </div>
          )}
        </AnalyticsContext>
        {isFriendlyUI && <StickiedPosts />}
        <HideRepeatedPostsProvider>
          {showCurated && <CuratedPostsList
            repeatedPostsPrecedence={1}
          />}
          {survey?.survey &&
            <SurveyPostsItem
              survey={survey.survey}
              surveyScheduleId={survey._id}
              refetchSurvey={refetchSurvey}
            />
          }
          <AnalyticsContext listContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              <PostsList2
                terms={recentPostsTerms}
                alwaysShowLoadMore
                hideHiddenFrontPagePosts
                viewType="fromContext"
                repeatedPostsPrecedence={2}
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

export default registerComponent('HomeLatestPosts', HomeLatestPosts, {styles});


