import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import { getBeforeDateDefault, getAfterDateDefault } from './timeframeUtils'

const styles = theme => ({
  daily: {
    padding: theme.spacing.unit,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    }
  },
  settingsIcon: {},
  title: {
    cursor: "pointer",
    '&:hover $settingsIcon, &:hover $sortedBy': {
      color: theme.palette.grey[800]
    }
  },
  sortedBy: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    display: "inline-block"
  }
});

export const timeframes = {
  allTime: 'All Time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

// TODO; days -> day
export const timeframeToTimeBlock = {
  daily: 'days',
  weekly: 'weeks',
  monthly: 'months',
  yearly: 'years',
}

const timeframeToNumTimeBlocks = {
  daily: getSetting('forum.numberOfDays', 5),
  weekly: getSetting('forum.numberOfWeeks', 3),
  monthly: getSetting('forum.numberOfMonths', 3),
  yearly: getSetting('forum.numberOfYears', 1),
}

export const sortings = {
  magic: 'Magic (New & Upvoted)',
  recentComments: 'Recent Comments',
  new: 'New',
  old: 'Old',
  top: 'Top',
}

class AllPostsPage extends Component {
  state = {
    showSettings: (this.props.currentUser && this.props.currentUser.allPostsOpenSettings) || false
  };

  toggleSettings = () => {
    const { currentUser, updateUser } = this.props

    this.setState((prevState) => ({showSettings: !prevState.showSettings}), () => {
      if (currentUser) {
        updateUser({
          selector: { _id: currentUser._id},
          data: {
            allPostsOpenSettings: this.state.showSettings,
          },
        })
      }
    })
  }

  // TODO; factor out part of logic from render
  // TODO; better args
  renderPostsList = (currentTimeframe, terms, classes, showSettings, query) => {
    // TODO; ensure defaults are right
    // TODO; and that user preference is remembered
    // TODO; and that queries are king
    // console.log('renderPostsList')
    // console.log('currentTimeframe', currentTimeframe)
    const numTimeBlocks = timeframeToNumTimeBlocks[currentTimeframe]
    const timeBlock = timeframeToTimeBlock[currentTimeframe]
    const dailyTerms = {
      view: 'timeframe',
      // TODO; is this properly overwritten?
      timeframe: currentTimeframe,
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      after: getAfterDateDefault(numTimeBlocks, timeBlock),
      before: getBeforeDateDefault(timeBlock),
      ...terms,
      ...query,
    };
    // console.log(' dailyTerms', dailyTerms)

    const {PostsTimeframeList, PostsList2} = Components
    if (currentTimeframe !== 'allTime') return <div className={classes.daily}>
      <PostsTimeframeList
        timeframe={currentTimeframe}
        terms={dailyTerms} // TODO; here
        numTimeBlocks={numTimeBlocks}
        dimWhenLoading={showSettings}
      />
    </div>
    return <PostsList2 terms={terms} showHeader={false} dimWhenLoading={showSettings} />
  }

  render() {
    // console.log('AllPostsPage render()')
    const { classes, currentUser, router } = this.props
    const { showSettings } = this.state
    const { SingleColumnSection, SectionTitle, SettingsIcon, MetaInfo, TabNavigationMenu, PostsListSettings } = Components
    // TODO; test by throwing crap at the query
    const query = _.clone(router.location.query) || {}
    // maintain backward compatibility with bookmarks
    const querySorting = query.sortedBy || query.view

    // TODO; generalize
    const currentTimeframe = query.timeframe ||
      (currentUser && currentUser.allPostsTimeframe) ||
      'allTime'
    // TODO; deal with daily or allTime
    // TODO[WIP] migration for allPostsView
    // maintain backward compatibility with previous user setting during
    // transition
    const currentSorting = querySorting ||
      (currentUser && (currentUser.allPostsSorting || currentUser.allPostsView)) ||
      'magic'
    const currentFilter = query.filter ||
      (currentUser && currentUser.allPostsFilter) ||
      'all'
    const currentShowLowKarma = (parseInt(query.karmaThreshold) === MAX_LOW_KARMA_THRESHOLD) || (currentUser && currentUser.allPostsShowLowKarma) || false

    // TODO; deal with old view query param overriding
    const terms = {
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      filter: currentFilter,
      sortedBy: currentSorting,
      ...query,
      limit:50
    }

    return (
      <React.Fragment>
        <TabNavigationMenu />
        <SingleColumnSection>
          <Tooltip title={`${showSettings ? "Hide": "Show"} options for sorting and filtering`} placement="top-end">
            <div className={classes.title} onClick={this.toggleSettings}>
              <SectionTitle title="All Posts">
                <SettingsIcon className={classes.settingsIcon}/>
                <MetaInfo className={classes.sortedBy}>
                  Sorted by { sortings[currentSorting] }
                </MetaInfo>
              </SectionTitle>
            </div>
          </Tooltip>
          <PostsListSettings
            hidden={!showSettings}
            currentTimeframe={currentTimeframe}
            currentSorting={currentSorting}
            currentFilter={currentFilter}
            currentShowLowKarma={currentShowLowKarma}
            persistentSettings
          />
          {this.renderPostsList(currentTimeframe, terms, classes, showSettings, query)}
        </SingleColumnSection>
      </React.Fragment>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
  ssr: false, // TODO; temporary
}

registerComponent(
  'AllPostsPage',
  AllPostsPage,
  withStyles(styles, {name:"AllPostsPage"}),
  withRouter,
  withUser,
  [withUpdate, withUpdateOptions]
);
