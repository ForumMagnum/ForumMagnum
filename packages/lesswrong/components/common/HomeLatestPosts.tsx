import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import {forumTypeSetting, taggingNamePluralSetting, taggingNameSetting} from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../posts/PostsPage/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import DateTimePicker from 'react-datetime';
import qs from 'qs';

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
  timescaleExperiment: {
    display: "flex",
    paddingLeft: 8,
  },
  timescaleExperimentHeading: {
    fontSize: 14,
    paddingBottom: 6,
  },
  timescaleSetting: {
    display: 'inline-flex',
    flexDirection: 'column',
    padding: 8,
  }
})

const latestPostsName = forumTypeSetting.get() === 'EAForum' ? 'Frontpage posts' : 'Latest Posts'

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const location = useLocation();
  const { history } = useNavigation();
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();

  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(!currentUser?.hideFrontpageFilterSettingsDesktop);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible: filterSettingsVisibleDesktop, pageSectionContext: "latestPosts"}, captureOnMount: true})
  const { query } = location;
  const {
    SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton, Typography,
    CuratedPostsList, CommentsListCondensed, SectionTitle, FormComponentDateTime
  } = Components
  const limit = parseInt(query.limit) || 13
  
  const now = query.now ? moment(query.now).tz(timezone) : moment().tz(timezone);
  console.log("now that is set at the top", now.format("YYYY-MM-DD HH:mm:ss"))
  const dateCutoff = now.clone().subtract(90, 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit,
    // experimental settings
    now: query.now,
    timescale: query.timescale, // the timescale over which to decay, in "days"
  }
  
  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisibleDesktop,
      settings: filterSettings,
    })
  }
  
  const recentSubforumDiscussionTerms = {
    view: "shortformFrontpage" as const,
    profileTagIds: currentUser?.profileTagIds,
  };

  const showCurated = isEAForum || (forumTypeSetting.get() === "LessWrong" && reviewIsActive())

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={latestPostsName} noBottomPadding>
          <LWTooltip title={`Use these buttons to increase or decrease the visibility of posts based on ${taggingNameSetting.get()}. Use the "+" button at the end to add additional ${taggingNamePluralSetting.get()} to boost or reduce them.`}>
            <SettingsButton
              className={classes.hideOnMobile}
              label={filterSettingsVisibleDesktop ?
                "Customize Feed (Hide)" :
                "Customize Feed"}
              showIcon={false}
              onClick={changeShowTagFilterSettingsDesktop}
            />
            <SettingsButton
              className={classes.hideOnDesktop}
              label={filterSettingsVisibleMobile ?
                "Customize Feed (Hide)" :
                "Customize Feed (Show)"}
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
        {/* TODO REMOVE, this div is for fiddling with experimental settings */}
        <div className={classes.timescaleExperiment}>
          <FormComponentDateTime
            path={"now"}
            value={now.format("YYYY-MM-DD HH:mm:ss")}
            name={"Effective Datetime"}
            label={"Effective Datetime"}
            onChange={(value) => {
              console.log("Setting current date:", value)
              const newQuery = {...query, now: value?.toISOString()}
              history.push({...location, search: `?${qs.stringify(newQuery)}`})
            }}
          />
          {/* Input for setting characteristic timescale in days */}
          <div className={classes.timescaleSetting}>
            <div className={classes.timescaleExperimentHeading}>
              Timescale (1 is current, higher is "slower")
            </div>
            <input
              type="number"
              value={query.timescale || 2}
              onChange={(e) => {
                console.log("Setting timescale:", e.target.value)
                const newQuery = {...query, timescale: e.target.value}
                history.push({...location, search: `?${qs.stringify(newQuery)}`})
              }}
            />
          </div>
        </div>
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
                <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
              </PostsList2>
            </AllowHidingFrontPagePostsContext.Provider>
            {/* TODO: To be re-enabled in an upcoming PR, along with a checkbox allowing users to
                opt-out of their shortform posts being shown on the frontpage */}
            {/* {isEAForum && (
              <CommentsListCondensed
                label={"Shortform discussion"}
                contentType="shortform"
                terms={recentSubforumDiscussionTerms}
                initialLimit={3}
              />
            )} */}
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
