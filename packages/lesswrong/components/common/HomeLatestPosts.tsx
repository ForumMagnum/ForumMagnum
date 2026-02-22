import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { frontpageDaysAgoCutoffSetting, isLW, isLWorAF, taggingNamePluralSetting, taggingNameSetting } from '@/lib/instanceSettings';
import classNames from 'classnames';
import { useState } from 'react';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { FilterSettings } from '../../lib/filterSettings';
import { forumSelect } from '../../lib/forumTypeUtils';
import moment from '../../lib/moment-timezone';
import { Link } from '../../lib/reactRouterWrapper';
import { reviewIsActive } from '../../lib/reviewUtils';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import SectionTitle, { sectionTitleStyle } from '../common/SectionTitle';
import { useCurrentUser } from '../common/withUser';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { useCurrentFrontpageSurvey } from '../hooks/useCurrentFrontpageSurvey';
import { useFilterSettings } from '../hooks/useFilterSettings';
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import SettingsButton from "../icons/SettingsButton";
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import PostsList2 from "../posts/PostsList2";
import CuratedPostsList from "../recommendations/CuratedPostsList";
import SurveyPostsItem from "../surveys/SurveyPostsItem";
import TagFilterSettings from "../tagging/TagFilterSettings";
import LWTooltip from "./LWTooltip";
import SingleColumnSection from "./SingleColumnSection";

const getTitleWrapperStyles = () => isLWorAF() ? {
  marginBottom: 8
} : {
  display: "flex",
  marginBottom: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const styles = defineStyles("HomeLatestPosts", (theme: ThemeType) => ({
  titleWrapper: getTitleWrapperStyles(),
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
}));

const getLatestPostsName = () => 'Latest Posts'

const getFilterSettingsToggleLabels = () => forumSelect({
  default: {
    desktopVisible: "Customize (Hide)",
    desktopHidden: "Customize",
    mobileVisible: "Customize (Hide)",
    mobileHidden: "Customize",
  }
})

const getAdvancedSortingText = () => "Advanced Sorting/Filtering";

const getDefaultLimit = () => 13;

const applyConstantFilters = (filterSettings: FilterSettings): FilterSettings => filterSettings;

const HomeLatestPosts = () => {
  const classes = useStyles(styles);
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();

  const {filterSettings, suggestedTagsQueryRef, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden.
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(!currentUser?.hideFrontpageFilterSettingsDesktop);
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
  const now = useCurrentTime();
  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get()*24, 'hours').startOf('hour').toISOString()

  const recentPostsTerms = {
    filterSettings: applyConstantFilters(filterSettings),
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit: getDefaultLimit(),
  } as const;
  
  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    if (isLWorAF()) {
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    }
    
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisibleDesktop,
      settings: filterSettings,
    })
  }

  const showCurated = (isLW() && reviewIsActive())

  const {survey, refetch: refetchSurvey} = useCurrentFrontpageSurvey();

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={getLatestPostsName()} noTopMargin={false} noBottomPadding>
          <div className={classes.postsListSettings}>
            <LWTooltip
              title={`Use these buttons to increase or decrease the visibility of posts based on ${taggingNameSetting.get()}. Use the "+" button at the end to add additional ${taggingNamePluralSetting.get()} to boost or reduce them.`}
              hideOnTouchScreens
            >
              <SettingsButton
                className={classes.hideOnMobile}
                label={filterSettingsVisibleDesktop ?
                  getFilterSettingsToggleLabels().desktopVisible :
                  getFilterSettingsToggleLabels().desktopHidden}
                showIcon={false}
                onClick={changeShowTagFilterSettingsDesktop}
                textShadow={isLWorAF()}
              />
              <SettingsButton
                className={classes.hideOnDesktop}
                label={filterSettingsVisibleMobile ?
                  getFilterSettingsToggleLabels().mobileVisible :
                  getFilterSettingsToggleLabels().mobileHidden}
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
            {false}
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
        {false}
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
                <Link to={"/allPosts"}>{getAdvancedSortingText()}</Link>
              </PostsList2>
            </AllowHidingFrontPagePostsContext.Provider>
          </AnalyticsContext>
        </HideRepeatedPostsProvider>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

export default HomeLatestPosts;

