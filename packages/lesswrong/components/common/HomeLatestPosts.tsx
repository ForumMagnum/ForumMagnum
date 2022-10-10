import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { forumTypeSetting, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../posts/PostsPage/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';

const styles = (theme: ThemeType): JssStyles => ({
  titleWrapper: {
    display: "flex",
    marginBottom: 8,
    flexWrap: "wrap",
    alignItems: "center"
  },
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
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  }
})

const latestPostsName = forumTypeSetting.get() === 'EAForum' ? 'Posts' : 'Latest'

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const currentUser = useCurrentUser();
  const location = useLocation();

  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible}, captureOnMount: true})
  const { query } = location;
  const { SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton, Typography, CuratedPostsList } = Components
  const limit = parseInt(query.limit) || 13
  
  const now = moment().tz(timezone);
  const dateCutoff = now.subtract(90, 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  }

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <div className={classes.titleWrapper}>
          <Typography variant='display1' className={classes.title}>
            <LWTooltip title="Recent posts, sorted by a combination of 'new' and 'highly upvoted'" placement="left">
              {latestPostsName}
            </LWTooltip>
          </Typography>
         
          <AnalyticsContext pageSectionContext="tagFilterSettings">
              <div className={classes.toggleFilters}>
                <SettingsButton 
                  label={filterSettingsVisible ?
                    "Hide Filters" :
                    `Show ${taggingNameCapitalSetting.get()} Filters`}
                  showIcon={false}
                  onClick={() => {
                    setFilterSettingsVisible(!filterSettingsVisible)
                    captureEvent("filterSettingsClicked", {
                      settingsVisible: !filterSettingsVisible,
                      settings: filterSettings,
                      pageSectionContext: "latestPosts"
                    })
                  }} />
              </div>
              <span className={!filterSettingsVisible ? classes.hideOnMobile : null}>
                <TagFilterSettings
                  filterSettings={filterSettings} setPersonalBlogFilter={setPersonalBlogFilter} setTagFilter={setTagFilter} removeTagFilter={removeTagFilter}
                />
              </span>
          </AnalyticsContext>
        </div>
        <HideRepeatedPostsProvider>
          {forumTypeSetting.get() === "EAForum" && <CuratedPostsList />}
          <AnalyticsContext listContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              <PostsList2 terms={recentPostsTerms} alwaysShowLoadMore hideHiddenFrontPagePosts>
                <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
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
