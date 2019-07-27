import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import { SplitComponent } from 'meteor/vulcan:routing';
import Users from 'meteor/vulcan:users';

class Home2 extends PureComponent {

  render () {
    const { currentUser } = this.props

    const { RecentDiscussionThreadsList, HomeLatestPosts, TabNavigationMenu, RecommendationsAndCurated } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
        Users.canDo(currentUser, 'alignment.sidebar')
  
    return (
      <React.Fragment>
        {shouldRenderSidebar && <SplitComponent name="SunshineSidebar" />}
        <Components.HeadTags image={getSetting('siteImage')} />
        <TabNavigationMenu />
        <RecommendationsAndCurated configName="frontpage" />
        <HomeLatestPosts />
        <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:20}}/>
      </React.Fragment>
    )
  }
}

registerComponent('Home2', Home2, withUser);
