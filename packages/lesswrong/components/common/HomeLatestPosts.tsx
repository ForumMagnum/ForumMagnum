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
import qs from 'qs';
import { calculateDecayFactor, defaultTimeDecayExprProps } from '../../lib/scoring';
import Button from '@material-ui/core/Button';
import { useMutation } from '@apollo/client/react/hooks/useMutation';
import { gql } from '@apollo/client';

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
    flexWrap: "wrap",
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
  },
  activityWidget: {
    display: "flex",
    flexDirection: "row",
    paddingBottom: 16,
  },
  activityWidgetDay: {
    // align center
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexBasis: 0,
    flexGrow: 1,
  },
  karmaButton: {
    width: 200
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
    CuratedPostsList, CommentsListCondensed, SectionTitle, FormComponentDateTime, FormComponentRadioGroup
  } = Components
  const limit = parseInt(query.limit) || 13
  
  const [updateDebugKarma] = useMutation(gql`
    mutation updateDebugKarma($now: String!) {
      updateDebugKarma(now: $now)
    }
  `);

  const now = query.now ? moment(query.now).tz(timezone) : moment().tz(timezone);
  console.log("now that is set at the top", now.format("YYYY-MM-DD HH:mm:ss"))
  const [daysAgoCutoff, setDaysAgoCutoff] = useState(14);
  const dateCutoff = now.clone().subtract(daysAgoCutoff, 'days').format("YYYY-MM-DD");
  
  const updatePostKarma = (now: string) => {
    if (!now) {
      throw new Error("now is not set")
    }
    // call mutation to update post karma
    void updateDebugKarma({variables: {now}})
    console.log("updating post karma (does not affect actual karma, just the debug version we are using)")
  }

  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit,
    // experimental settings
    now: query.now,
    timescale: query.timescale ?? 1, // the timescale over which to decay, in "days"
    mode: query.mode, // either hyperbolic or exponential
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

  // experimental settings sections
  const createNumberWidget = (name: string, defaultValue?: number, step = 1) => {
    return <div className={classes.timescaleSetting}>
      <div className={classes.timescaleExperimentHeading}>{name}</div>
      <input
        type="number"
        value={query[name] || defaultValue}
        onChange={(e) => {
          console.log(`Setting ${name}:`, e.target.value);
          const newQuery = { ...query, [name]: e.target.value };
          history.push({ ...location, search: `?${qs.stringify(newQuery)}` });
        }}
        step={step}
      />
    </div>;
  }

  const activityArray = query.activity ? Object.keys(query.activity).map(k => query.activity[k]) : defaultTimeDecayExprProps.activity;
  const { hypDecayFactor, activityFactor } = calculateDecayFactor({
    activity: activityArray,
    activityHalfLifeHours: query.activityHalfLifeHours ? Number(query.activityHalfLifeHours) : defaultTimeDecayExprProps.activityHalfLifeHours,
    hypDecayFactorSlowest: query.hypDecayFactorSlowest ? Number(query.hypDecayFactorSlowest) : defaultTimeDecayExprProps.hypDecayFactorSlowest,
    hypDecayFactorFastest: query.hypDecayFactorFastest ? Number(query.hypDecayFactorFastest) : defaultTimeDecayExprProps.hypDecayFactorFastest,
    activityWeight: query.activityWeight ? Number(query.activityWeight) : defaultTimeDecayExprProps.activityWeight,
  })

  // checkbox for previous 28 days with e.g "-5" for 5 days ago
  const activityWidget = <div className={classes.activityWidget}>
    {new Array(28).fill(0).map((_, i) => {
      const day = -i;
      const dayString = day.toString();
      return <div key={dayString} className={classes.activityWidgetDay}>
        {dayString}
        <input
          type="checkbox"
          checked={Number(activityArray[i]) !== 0}
          onChange={(e) => {
            let newActivityArray = [...activityArray];
            newActivityArray[i] = e.target.checked ? 1 : 0;
            console.log(`Setting activity for day ${dayString}`, newActivityArray[i])
            const newQuery = { ...query, activity: newActivityArray };
            history.push({ ...location, search: `?${qs.stringify(newQuery)}` });
          }}
        />
      </div>
    })}
  </div>
  // end experimental settings sections

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
          <Button className={classes.karmaButton} onClick={() => updatePostKarma(now.toISOString())}>
            Update Karma to current effective date
          </Button>
          {createNumberWidget("hypStartingAgeHours", defaultTimeDecayExprProps.hypStartingAgeHours, 1)}
          {createNumberWidget("hypDecayFactorSlowest", defaultTimeDecayExprProps.hypDecayFactorSlowest, 0.05)}
          {createNumberWidget("hypDecayFactorFastest", defaultTimeDecayExprProps.hypDecayFactorFastest, 0.05)}
          {/* {createNumberWidget("expHalfLifeHours", 48)}
          {createNumberWidget("expWeight", 0)} */}
          {createNumberWidget("activityHalfLifeHours", defaultTimeDecayExprProps.activityHalfLifeHours, 1)}
          {createNumberWidget("activityWeight", defaultTimeDecayExprProps.activityWeight, 0.1)}
          <div className={classes.timescaleSetting}>
            <div className={classes.timescaleExperimentHeading}>daysAgoCutoff</div>
            <input
              type="number"
              value={daysAgoCutoff}
              onChange={(e) => {
                console.log(`Setting daysAgoCutoff:`, e.target.value);
                setDaysAgoCutoff(Number(e.target.value));
              }}
              step={1}
            />
          </div>
        </div>
        <br/>
        {activityWidget}
        <div>
          Calculated activityFactor: {activityFactor}
        </div>
        <br/>
        <div>
          Calculated hypDecayFactor: {hypDecayFactor}
        </div>
        <br/>
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
