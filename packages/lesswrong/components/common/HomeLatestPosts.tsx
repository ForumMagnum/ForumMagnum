import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import { defaultFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';

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

const latestPostsName = forumTypeSetting.get() === 'EAForum' ? 'Frontpage Posts' : 'Latest'

const useFilterSettings = (currentUser: UsersCurrent|null) => {
  const defaultSettings = currentUser?.frontpageFilterSettings ? currentUser.frontpageFilterSettings : defaultFilterSettings;

  return useState(defaultSettings);
}

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const updateCurrentUser = useUpdateCurrentUser();

  const [filterSettings, setFilterSettings] = useFilterSettings(currentUser);
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible}, captureOnMount: true})
  const { query } = location;
  const { SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton, Typography } = Components
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
                  label={filterSettingsVisible  ? "Hide Filters" : "Show Tag Filters"}
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
                  filterSettings={filterSettings} setFilterSettings={(newSettings) => {
                    setFilterSettings(newSettings)
                    void updateCurrentUser({
                      frontpageFilterSettings: newSettings
                    });
                  }}
                />
              </span>
          </AnalyticsContext>
        </div>
        <AnalyticsContext listContext={"latestPosts"}>
          <AnalyticsContext listContext={"curatedPosts"}>
            <PostsList2
              terms={{view:"curated", limit: currentUser ? 3 : 2}}
              showNoResults={false}
              showLoadMore={false}
              hideLastUnread={true}
              boxShadow={false}
              curatedIconLeft={true}
              showFinalBottomBorder={true}
            />
          </AnalyticsContext>
          <PostsList2 terms={recentPostsTerms}>
            <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
          </PostsList2>
        </AnalyticsContext>
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
