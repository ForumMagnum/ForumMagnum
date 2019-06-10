import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import Typography from '@material-ui/core/Typography'
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

const styles = theme => ({
  daily: {
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
  },
  sortedBy: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    display: "inline-block"
  }
});

// TODO; doc
// TODO; more timeframes
const timeframes = {
  daily: "Daily",
  monthly: "Monthly",
}

const timeframeToTimeBlock = {
  daily: 'days',
  monthly: 'months',
}

export const sortings = {
  magic: "Magic (New & Upvoted)",
  recentComments: "Recent Comments",
  new: "New",
  old: "Old",
  top: "Top",
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
  renderPostsList = (currentView, terms, classes, showSettings, query) => {
    // TODO; ensure defaults are right
    // TODO; and that user preference is remembered
    // TODO; and that queries are king
    console.log('renderPostsList')
    const timeframe = 'monthly'
    const numberOfDays = 2 // getSetting('forum.numberOfDays', 5);
    const dailyTerms = {
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      ...query,
    };
    console.log('  dailyTerms', dailyTerms)

    const {PostsDailyList, PostsList2} = Components
    // currentView === "daily"
    if (true) return <div className={classes.daily}>
      <PostsDailyList
        // TODO; title unused?
        title="Posts by Day"
        timeframe={timeframe}
        terms={dailyTerms}
        numTimeBlocks={numberOfDays}
        dimWhenLoading={showSettings}
      />
    </div>
    // // TODO; factor out component
    // if (currentView === "monthly") return <div>
    //   <Typography variant="headline">
    //     June
    //   </Typography>
    // </div>
    return <PostsList2 terms={terms} showHeader={false} dimWhenLoading={showSettings} />
  }

  render() {
    console.log('AllPostsPage render()')
    const { classes, currentUser, router } = this.props
    const { showSettings } = this.state
    const { PostsListSettings, SingleColumnSection, SectionTitle, MetaInfo, TabNavigationMenu, SettingsIcon } = Components
    const query = _.clone(router.location.query) || {}
    // maintain backward compatibility with bookmarks
    const querySorting = query.sortedBy || query.view

    // TODO[WIP] migration for allPostsView
    // maintain backward compatibility with previous user setting during
    // transition
    const currentSorting = querySorting ||
      (currentUser && (currentUser.allPostsSorting || currentUser.allPostsView)) ||
      "daily"
    const currentFilter = query.filter ||
      (currentUser && currentUser.allPostsFilter) ||
      "all"
    const currentShowLowKarma = (parseInt(query.karmaThreshold) === MAX_LOW_KARMA_THRESHOLD) || (currentUser && currentUser.allPostsShowLowKarma) || false

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
            currentSorting={currentSorting}
            currentFilter={currentFilter}
            currentShowLowKarma={currentShowLowKarma}
            persistentSettings
          />
          {this.renderPostsList(currentSorting, terms, classes, showSettings, query)}
        </SingleColumnSection>
      </React.Fragment>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('AllPostsPage', AllPostsPage, withStyles(styles, {name:"AllPostsPage"}), withRouter, withUser, [withUpdate, withUpdateOptions]);
