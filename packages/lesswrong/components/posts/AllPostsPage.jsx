import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

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

export const sortings = {
  daily: "Daily",
  magic: "Magic (New & Upvoted)",
  recentComments: "Recent Comments",
  new: "New",
  old: "Old",
  top: "Top"
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

  render() {
    const { classes, currentUser, router } = this.props
    const { showSettings } = this.state
    const { PostsListSettings, PostsList2, SingleColumnSection, SectionTitle, PostsDailyList, MetaInfo, TabNavigationMenu, SettingsIcon } = Components
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

    const numberOfDays = getSetting('forum.numberOfDays', 10);
    const dailyTerms = {
      view: 'daily',
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      filter: currentFilter,
      ...query,
    };

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
          {currentSorting === "daily" ?
            <div className={classes.daily}>
              <PostsDailyList
                after={moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD')}
                before={moment().utc().add(1, 'days').format('YYYY-MM-DD')}
                postListParameters={dailyTerms}
                dimWhenLoading={showSettings}
              />
            </div>
            :
            <PostsList2 terms={terms} showHeader={false} dimWhenLoading={showSettings} />
          }
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
