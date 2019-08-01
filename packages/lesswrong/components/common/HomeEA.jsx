import { Components, registerComponent } from 'meteor/vulcan:core'
import React, { PureComponent } from 'react'
import withUser from '../common/withUser'
import { SplitComponent } from 'meteor/vulcan:routing'
import Users from 'meteor/vulcan:users'

class HomeEA extends PureComponent {
  render () {
    const { currentUser } = this.props
    const { RecentDiscussionThreadsList, HomeLatestPosts, ConfigurableRecommendationsList, } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')

    return (
      <React.Fragment>
        {shouldRenderSidebar && <SplitComponent name="SunshineSidebar" />}

        {currentUser && Users.isAdmin(currentUser) &&
          <ConfigurableRecommendationsList configName="frontpage" />
        }

        <HomeLatestPosts />
        <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:20}}/>
      </React.Fragment>
    )
  }
}

registerComponent('HomeEA', HomeEA, withUser)
