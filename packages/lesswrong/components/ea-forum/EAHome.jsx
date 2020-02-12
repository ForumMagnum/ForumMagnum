import { Components, registerComponent } from 'meteor/vulcan:core'
import React, { PureComponent } from 'react'
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users'


const shouldShowHandbook = (currentUser, cookieSomething) => {
  // if hasSeenHandbook(currentUser) return false
  return true
}

class EAHome extends PureComponent {
  render () {
    const { currentUser } = this.props
    const { RecentDiscussionThreadsList, HomeLatestPosts, ConfigurableRecommendationsList, EAHomeHandbook } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all')
    const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
    const showHandbook = shouldShowHandbook(currentUser)

    return (
      <React.Fragment>
        {shouldRenderSidebar && <Components.SunshineSidebar/>}

        {showHandbook && <EAHomeHandbook />}

        <HomeLatestPosts />

        <ConfigurableRecommendationsList configName="frontpageEA" />

        <RecentDiscussionThreadsList
          terms={{view: 'recentDiscussionThreadsList', limit:20}}
          commentsLimit={recentDiscussionCommentsPerPost}
          maxAgeHours={18}
          af={false}
        />
      </React.Fragment>
    )
  }
}

registerComponent('EAHome', EAHome, withUser)
