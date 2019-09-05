import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import AddBoxIcon from '@material-ui/icons/AddBox';

// TODO;(EA Forum) Confirm we match after merge

class Home2 extends PureComponent {

  render () {
    const { currentUser } = this.props

    const { RecentDiscussionThreadsList, HomeLatestPosts, RecommendationsAndCurated } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
        Users.canDo(currentUser, 'alignment.sidebar')

    return (
      <React.Fragment>
        {shouldRenderSidebar && <Components.SunshineSidebar/>}

        <RecommendationsAndCurated configName="frontpage" />

        <HomeLatestPosts />
        <RecentDiscussionThreadsList
          terms={{view: 'recentDiscussionThreadsList', limit:20}}
          commentsLimit={4}
          maxAgeHours={18}
          af={false}
        />
      </React.Fragment>
    )
  }
}

registerComponent('Home2', Home2, withUser);
