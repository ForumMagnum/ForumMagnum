import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { withRouter } from 'react-router';
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import withUser from '../common/withUser';
import SettingsIcon from '@material-ui/icons/Settings';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';

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
  constructor(props) {
    super(props);
    this.state = {
      showSettings: (props.currentUser && props.currentUser.allPostsOpenSettings) || false,
    };
  }

  toggleSettings = () => {
    const { currentUser, updateUser } = this.props
    this.setState({showSettings: !this.state.showSettings})
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsOpenSettings: !this.state.showSettings,
        },
      })  
    }
  }

  render() {
    const { classes, currentUser } = this.props
    const { showSettings } = this.state
    const { AllPostsPageSettings, PostsList, SingleColumnSection, SectionTitle } = Components
    const query = _.clone(this.props.router.location.query) || {}

    const view = query.view || (currentUser && currentUser.allPostsView) || "daily"

    const terms = {
      karmaThreshold: DEFAULT_LOW_KARMA_THRESHOLD,
      view: view,
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
        <AllPostsPageSettings hidden={!showSettings}/>
        <div className={classes.allPostsContent}>
          {view === "daily" ?
            <Components.PostsDailyList title="Posts by Day" terms={dailyTerms} days={numberOfDays} dimWhenLoading={true} />
            :
            <PostsList terms={terms} showHeader={false} dimWhenLoading={true} />
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
