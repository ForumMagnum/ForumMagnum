import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib'
import React from 'react'
import { useCurrentUser } from '../common/withUser'
import Users from '../../lib/collections/users/collection'
import { userHasEAHomeHandbook } from '../../lib/betas'

const EAHome = () => {
  const currentUser = useCurrentUser();
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

const EAHomeComponent = registerComponent('EAHome', EAHome)

declare global {
  interface ComponentTypes {
    EAHome: typeof EAHomeComponent
  }
}
