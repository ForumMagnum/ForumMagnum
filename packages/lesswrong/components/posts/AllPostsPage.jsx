import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { withRouter } from 'react-router';
import withUser from '../common/withUser';
import SettingsIcon from '@material-ui/icons/Settings';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

const styles = theme => ({
  allPostsContent: {
    padding: theme.spacing.unit
  },
  settingsIcon: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    color: theme.palette.grey[400],
    width:40,
    cursor: "pointer"
  },
});

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
    const { AllPostsPageSettings, PostsList, SingleColumnSection, SectionTitle, PostsDailyList } = Components
    const query = _.clone(router.location.query) || {}

    const currentView = query.view || (currentUser && currentUser.allPostsView) || "daily"
    const currentFilter = query.filter || (currentUser && currentUser.allPostsFilter) || "all"
    const currentShowLowKarma = (query.karmaThreshold && (query.karmaThreshold == MAX_LOW_KARMA_THRESHOLD)) || (currentUser && currentUser.allPostsShowLowKarma) || false

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
      <SingleColumnSection>
        <SectionTitle title="All Posts">
          <Tooltip title="All Posts Settings">
            <SettingsIcon className={classes.settingsIcon} onClick={this.toggleSettings}/>
          </Tooltip>
        </SectionTitle>
        <AllPostsPageSettings 
          hidden={!showSettings} 
          currentView={currentView} 
          currentFilter={currentFilter}
          currentShowLowKarma={currentShowLowKarma}
        />
        <div className={classes.allPostsContent}>
          {currentView === "daily" ?
            <PostsDailyList title="Posts by Day" terms={dailyTerms} days={numberOfDays} dimWhenLoading={showSettings} />
            :
            <PostsList terms={terms} showHeader={false} dimWhenLoading={showSettings} />
          }
        </div>
      </SingleColumnSection>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('AllPostsPage', AllPostsPage, withStyles(styles, {name:"AllPostsPage"}), withRouter, withUser, [withUpdate, withUpdateOptions]);
