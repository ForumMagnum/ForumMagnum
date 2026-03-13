import React, { useState } from 'react';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../hooks/useFilterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { isLW, frontpageDaysAgoCutoffSetting } from '@/lib/instanceSettings';
import SectionTitle, { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import { isFriendlyUI } from '../../themes/forumTheme';
import SingleColumnSection from "./SingleColumnSection";
import PostsList2 from "../posts/PostsList2";
import TagFilterSettings from "../tagging/TagFilterSettings";
import LWTooltip from "./LWTooltip";
import SettingsButton from "../icons/SettingsButton";
import CuratedPostsList from "../recommendations/CuratedPostsList";
import PostsListViewToggle from "../posts/PostsListViewToggle";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("HomeLatestPosts", (theme: ThemeType) => ({
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

const getLatestPostsName = () => isFriendlyUI() ? 'New & upvoted' : 'Latest Posts'

const getAdvancedSortingText = () => isFriendlyUI()
  ? "Advanced sorting & filtering"
  : "Advanced Sorting/Filtering";

const getDefaultLimit = () => isFriendlyUI() ? 11 : 13;

const HomeLatestPosts = () => {
  const classes = useStyles(styles);
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();

  const {filterSettings, suggestedTagsQueryRef, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum/FriendlyUI it always starts out hidden)
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(isFriendlyUI() ? false : !currentUser?.hideFrontpageFilterSettingsDesktop);
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
    filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit: getDefaultLimit(),
  } as const;
  
  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisibleDesktop,
      settings: filterSettings,
    })
  }

  const showCurated = isFriendlyUI() || (isLW() && reviewIsActive())

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={getLatestPostsName()} noTopMargin={isFriendlyUI()} noBottomPadding>
          <div className={classes.postsListSettings}>
            <LWTooltip
              title={`Use these buttons to increase or decrease the visibility of posts based on wikitag. Use the "+" button at the end to add additional wikitags to boost or reduce them.`}
              hideOnTouchScreens
            >
              <SettingsButton
                className={classes.hideOnMobile}
                label={filterSettingsVisibleDesktop
                  ? "Customize (Hide)"
                  : "Customize"}
                showIcon={false}
                onClick={changeShowTagFilterSettingsDesktop}
                textShadow={true}
              />
              <SettingsButton
                className={classes.hideOnDesktop}
                label={filterSettingsVisibleMobile
                  ? "Customize (Hide)"
                  : "Customize"}
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
            {isFriendlyUI() && <PostsListViewToggle />}
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
        <HideRepeatedPostsProvider>
          {showCurated && <CuratedPostsList
            repeatedPostsPrecedence={1}
          />}
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


