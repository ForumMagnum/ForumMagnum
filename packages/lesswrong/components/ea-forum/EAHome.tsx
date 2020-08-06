import React from 'react'
import { userHasEAHomeHandbook } from '../../lib/betas'
import { PublicInstanceSetting } from '../../lib/instanceSettings'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { useCurrentUser } from '../common/withUser'

const eaHomeSequenceIdSetting = new PublicInstanceSetting<string | null>('eaHomeSequenceId', null, "optional") // Sequence ID for the EAHomeHandbook sequence

const EAHome = () => {
  const currentUser = useCurrentUser();
  const {
    RecentDiscussionThreadsList, HomeLatestPosts, EAHomeHandbook, RecommendationsAndCurated
  } = Components

  const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
  const shouldRenderEAHomeHandbook = userHasEAHomeHandbook(currentUser)

  return (
    <React.Fragment>
      {shouldRenderEAHomeHandbook && <EAHomeHandbook documentId={eaHomeSequenceIdSetting.get()}/>}

      <HomeLatestPosts />

      <RecommendationsAndCurated configName="frontpageEA" />

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
