import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import withUser from '../common/withUser';
import SettingsIcon from '@material-ui/icons/Settings';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

// TODO: If we go back to having an option to include all posts on the
// frontpage, I think it makes sense to think about rebranding this page to
// custom view or some such

const styles = theme => ({
  daily: {
    padding: theme.spacing.unit,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    }
  },
  settingsIcon: {
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
  title: {
    cursor: "pointer",
    '&:hover $settingsIcon, &:hover $sortedBy': {
      color: theme.palette.grey[800]
    }
  },
  sortedBy: {
    fontStyle: "italic",
    display: "inline-block"
  }
});

export const views = {
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
    const { PostsListSettings, PostsList2, SingleColumnSection, SectionTitle, PostsDailyList, MetaInfo, TabNavigationMenu } = Components
    const query = _.clone(router.location.query) || {}

    const currentView = query.view || (currentUser && currentUser.allPostsView) || "daily"
    const currentFilter = query.filter || (currentUser && currentUser.allPostsFilter) || "all"
    const currentShowLowKarma = (parseInt(query.karmaThreshold) === MAX_LOW_KARMA_THRESHOLD) || (currentUser && currentUser.allPostsShowLowKarma) || false

    const terms = {
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      view: currentView,
      ...query,
      limit:50
    }

    const numberOfDays = getSetting('forum.numberOfDays', 5);
    const dailyTerms = {
      view: 'daily',
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      after: moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD'),
      ...query,
      before: moment().utc().add(1, 'days').format('YYYY-MM-DD'),
    };

    return (
      <React.Fragment>
        <SingleColumnSection>
          <Tooltip title={`${showSettings ? "Hide": "Show"} options for sorting and filtering`} placement="top-end">
            <div className={classes.title} onClick={this.toggleSettings}>
              <SectionTitle title="All Posts">
                <SettingsIcon className={classes.settingsIcon}/>
                <MetaInfo className={classes.sortedBy}>Sorted by { views[currentView] }</MetaInfo>
              </SectionTitle>
            </div>
          </Tooltip>
          <PostsListSettings
            hidden={!showSettings}
            currentView={currentView}
            currentFilter={currentFilter}
            currentShowLowKarma={currentShowLowKarma}
            persistentSettings
          />
          {currentView === "daily" ?
            <div className={classes.daily}>
              <PostsDailyList title="Posts by Day" terms={dailyTerms} days={numberOfDays} dimWhenLoading={showSettings} />
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
