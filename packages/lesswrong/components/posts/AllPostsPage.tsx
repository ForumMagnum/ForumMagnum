import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import React, { Component } from 'react';
import { withLocation } from '../../lib/routeUtil';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import { getBeforeDefault, getAfterDefault, timeframeToTimeBlock } from './timeframeUtils'
import { withTimezone } from '../common/withTimezone';
import {AnalyticsContext, withTracking} from "../../lib/analyticsEvents";
import { forumAllPostsNumDaysSetting, DatabasePublicSetting } from '../../lib/publicSettings';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/sortOrderOptions';
import { AllowHidingFrontPagePostsContext } from './PostsPage/PostActions';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    cursor: "pointer",
  }
});

export const timeframes = {
  allTime: 'All Time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const forumAllPostsNumWeeksSetting = new DatabasePublicSetting<number>('forum.numberOfWeeks', 4) // Number of weeks to display in the timeframe view
const forumAllPostsNumMonthsSetting = new DatabasePublicSetting<number>('forum.numberOfMonths', 4) // Number of months to display in the timeframe view
const forumAllPostsNumYearsSetting = new DatabasePublicSetting<number>('forum.numberOfYears', 4) // Number of years to display in the timeframe view

const timeframeToNumTimeBlocks = {
  daily: forumAllPostsNumDaysSetting.get(),
  weekly: forumAllPostsNumWeeksSetting.get(),
  monthly: forumAllPostsNumMonthsSetting.get(),
  yearly: forumAllPostsNumYearsSetting.get(),
}

interface AllPostsPageProps extends WithUserProps, WithStylesProps, WithTimezoneProps, WithLocationProps, WithUpdateCurrentUserProps, WithTrackingProps {
}
interface AllPostsPageState {
  showSettings: boolean,
}

class AllPostsPage extends Component<AllPostsPageProps,AllPostsPageState> {
  state: AllPostsPageState = {
    showSettings: (this.props.currentUser && this.props.currentUser.allPostsOpenSettings) || false
  };

  toggleSettings = () => {
    const { currentUser, updateCurrentUser } = this.props

    this.setState((prevState) => ({showSettings: !prevState.showSettings}), () => {
      this.props.captureEvent("toggleSettings", {action: this.state.showSettings, listContext: "allPostsPage"})

      if (currentUser) {
        void updateCurrentUser({
          allPostsOpenSettings: this.state.showSettings,
        })
      }
    })
  }

  renderPostsList = ({currentTimeframe, currentFilter, currentSorting, currentShowLowKarma, currentIncludeEvents}) => {
    const { timezone, location } = this.props
    const { query } = location
    const { showSettings } = this.state
    const {PostsTimeframeList, PostsList2} = Components

    const baseTerms: PostsViewTerms = {
      karmaThreshold: query.karmaThreshold || (currentShowLowKarma ? MAX_LOW_KARMA_THRESHOLD : DEFAULT_LOW_KARMA_THRESHOLD),
      excludeEvents: !currentIncludeEvents && currentFilter !== 'events',
      filter: currentFilter,
      sortedBy: currentSorting,
      after: query.after,
      before: query.before
    }

    if (currentTimeframe === 'allTime') {
      return <AnalyticsContext listContext={"allPostsPage"} terms={{view: 'allTime', ...baseTerms}}>
        <PostsList2
          terms={{
            ...baseTerms,
            limit: 50
          }}
          dimWhenLoading={showSettings}
        />
      </AnalyticsContext>
    }

    const numTimeBlocks = timeframeToNumTimeBlocks[currentTimeframe]
    const timeBlock = timeframeToTimeBlock[currentTimeframe]
    
    let postListParameters: PostsViewTerms = {
      view: 'timeframe',
      ...baseTerms
    }

    if (parseInt(query.limit)) {
      postListParameters.limit = parseInt(query.limit)
    }
    
    return <div>
      <AnalyticsContext
        listContext={"allPostsPage"}
        terms={postListParameters}
        capturePostItemOnMount
      >
        {/* Allow unhiding posts from all posts menu to allow recovery of hiding the wrong post*/}
        <AllowHidingFrontPagePostsContext.Provider value={true}>
          <PostsTimeframeList
            timeframe={currentTimeframe}
            postListParameters={postListParameters}
            numTimeBlocks={numTimeBlocks}
            dimWhenLoading={showSettings}
            after={query.after || getAfterDefault({numTimeBlocks, timeBlock, timezone, before: query.before})}
            before={query.before  || getBeforeDefault({timeBlock, timezone, after: query.after})}
            reverse={query.reverse === "true"}
            displayShortform={query.includeShortform !== "false"}
          />
        </AllowHidingFrontPagePostsContext.Provider>
      </AnalyticsContext>
    </div>
  }

  render() {
    const { classes, currentUser } = this.props
    const { query } = this.props.location;
    const { showSettings } = this.state
    const { SingleColumnSection, SectionTitle, SortButton, PostsListSettings, HeadTags } = Components

    const currentTimeframe = query.timeframe || currentUser?.allPostsTimeframe || 'daily'
    const currentSorting = query.sortedBy    || currentUser?.allPostsSorting   || 'magic'
    const currentFilter = query.filter       || currentUser?.allPostsFilter    || 'all'
    const currentShowLowKarma = (parseInt(query.karmaThreshold) === MAX_LOW_KARMA_THRESHOLD) ||
      currentUser?.allPostsShowLowKarma || false
    const currentIncludeEvents = (query.includeEvents === 'true') || currentUser?.allPostsIncludeEvents || false

    return (
      <React.Fragment>
        <HeadTags description={`All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`}/>
        <AnalyticsContext pageContext="allPostsPage">
          <SingleColumnSection>
            <Tooltip title={`${showSettings ? "Hide": "Show"} options for sorting and filtering`} placement="top-end">
              <div className={classes.title} onClick={this.toggleSettings}>
                <SectionTitle title="All Posts">
                  <SortButton label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`}/>
                </SectionTitle>
              </div>
            </Tooltip>
            <PostsListSettings
              hidden={!showSettings}
              currentTimeframe={currentTimeframe}
              currentSorting={currentSorting}
              currentFilter={currentFilter}
              currentShowLowKarma={currentShowLowKarma}
              currentIncludeEvents={currentIncludeEvents}
              persistentSettings
              showTimeframe
            />
            {this.renderPostsList({currentTimeframe, currentSorting, currentFilter, currentShowLowKarma, currentIncludeEvents})}
          </SingleColumnSection>
        </AnalyticsContext>
      </React.Fragment>
    )
  }
}

const AllPostsPageComponent = registerComponent(
  'AllPostsPage', AllPostsPage, {
    styles,
    hocs: [
      withLocation, withUser, withTimezone,
      withUpdateCurrentUser, withTracking
    ]
  }
);

declare global {
  interface ComponentTypes {
    AllPostsPage: typeof AllPostsPageComponent
  }
}
