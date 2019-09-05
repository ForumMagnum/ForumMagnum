import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { withLocation } from '../../lib/routeUtil';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import { getBeforeDefault, getAfterDefault, timeframeToTimeBlock } from './timeframeUtils'
import withTimezone from '../common/withTimezone';

// TODO: If we go back to having an option to include all posts on the
// frontpage, I think it makes sense to think about rebranding this page to
// custom view or some such

const styles = theme => ({
  timeframe: {
    padding: theme.spacing.unit,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    }
  },
  title: {
    cursor: "pointer",
    '&:hover $settingsIcon, &:hover $sortedBy': {
      color: theme.palette.grey[800]
    }
  }
});

export const timeframes = {
  allTime: 'All Time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const timeframeToNumTimeBlocks = {
  daily: getSetting('forum.numberOfDays'),
  weekly: getSetting('forum.numberOfWeeks'),
  monthly: getSetting('forum.numberOfMonths'),
  yearly: getSetting('forum.numberOfYears'),
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

  renderPostsList = ({currentTimeframe, currentFilter, currentSorting, currentShowLowKarma}) => {
    const { timezone, classes } = this.props
    const { showSettings } = this.state
    const {PostsTimeframeList, PostsList2} = Components

    const baseTerms = {
      karmaThreshold: currentShowLowKarma ? MAX_LOW_KARMA_THRESHOLD : DEFAULT_LOW_KARMA_THRESHOLD,
      filter: currentFilter,
      sortedBy: currentSorting,
    }

    if (currentTimeframe === 'allTime') {
      return <PostsList2
        terms={{...baseTerms, limit: 50}}
        showHeader={false}
        dimWhenLoading={showSettings}
      />
    }

    const numTimeBlocks = timeframeToNumTimeBlocks[currentTimeframe]
    const timeBlock = timeframeToTimeBlock[currentTimeframe]
    return <div className={classes.timeframe}>
      <PostsTimeframeList
        timeframe={currentTimeframe}
        postListParameters={{
          view: 'timeframe',
          ...baseTerms
        }}
        numTimeBlocks={numTimeBlocks}
        dimWhenLoading={showSettings}
        after={getAfterDefault({numTimeBlocks, timeBlock, timezone})}
        before={getBeforeDefault({timeBlock, timezone})}
      />
    </div>
  }

  render() {
    const { classes, currentUser } = this.props
    const { query } = this.props.location;
    const { showSettings } = this.state
    const { SingleColumnSection, SectionTitle, SettingsIcon, PostsListSettings } = Components

    const currentTimeframe = query.timeframe ||
      (currentUser && currentUser.allPostsTimeframe) ||
      'daily'
    const currentSorting = query.sortedBy ||
      (currentUser && (currentUser.allPostsSorting)) ||
      'magic'
    const currentFilter = query.filter ||
      (currentUser && currentUser.allPostsFilter) ||
      'all'
    const currentShowLowKarma = (parseInt(query.karmaThreshold) === MAX_LOW_KARMA_THRESHOLD) ||
      (currentUser && currentUser.allPostsShowLowKarma) ||
      false

    return (
      <React.Fragment>
        <SingleColumnSection>
          <Tooltip title={`${showSettings ? "Hide": "Show"} options for sorting and filtering`} placement="top-end">
            <div className={classes.title} onClick={this.toggleSettings}>
              <SectionTitle title="All Posts">
                <SettingsIcon label={`Sorted by ${ sortings[currentSorting] }`}/>
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
            showTimeframe
          />
          {this.renderPostsList({currentTimeframe, currentSorting, currentFilter, currentShowLowKarma})}
        </SingleColumnSection>
      </React.Fragment>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent(
  'AllPostsPage',
  AllPostsPage,
  withStyles(styles, {name:"AllPostsPage"}),
  withLocation,
  withUser,
  withTimezone,
  [withUpdate, withUpdateOptions]
);
