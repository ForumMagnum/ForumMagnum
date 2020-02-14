import { Components, registerComponent, getSetting } from 'meteor/vulcan:core'
import React, { PureComponent } from 'react'
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users'
import { userHasEAHomeHandbook } from '../../lib/betas'


class EAHome extends PureComponent {
  render () {
    const { currentUser } = this.props
    const {
      RecentDiscussionThreadsList, HomeLatestPosts, ConfigurableRecommendationsList,
      EAHomeHandbook
    } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all')
    const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
    const shouldRenderEAHomeHandbook = userHasEAHomeHandbook(currentUser)

    return (
      <React.Fragment>
        {shouldRenderSidebar && <Components.SunshineSidebar/>}

        {shouldRenderEAHomeHandbook && <EAHomeHandbook documentId={getSetting('eaHomeSequenceId')}/>}

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
