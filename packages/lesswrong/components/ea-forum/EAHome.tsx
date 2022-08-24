import React from 'react'
import { PublicInstanceSetting } from '../../lib/instanceSettings'
import { DatabasePublicSetting } from '../../lib/publicSettings'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { useCurrentUser } from '../common/withUser'
import { reviewIsActive } from '../../lib/reviewUtils'

const eaHomeSequenceIdSetting = new PublicInstanceSetting<string | null>('eaHomeSequenceId', null, "optional") // Sequence ID for the EAHomeHandbook sequence
const showSmallpoxSetting = new DatabasePublicSetting<boolean>('showSmallpox', false)
const showHandbookBannerSetting = new DatabasePublicSetting<boolean>('showHandbookBanner', false)
const showEventBannerSetting = new DatabasePublicSetting<boolean>('showEventBanner', false)

const EAHome = () => {
  const currentUser = useCurrentUser();
  const {
    RecentDiscussionFeed, HomeLatestPosts, EAHomeHandbook, RecommendationsAndCurated,
    SmallpoxBanner, StickiedPosts, EventBanner, FrontpageReviewWidget, SingleColumnSection
  } = Components

  const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
  const shouldRenderEventBanner = showEventBannerSetting.get()
  const shouldRenderSmallpox = showSmallpoxSetting.get()

  return (
    <React.Fragment>
      {shouldRenderSmallpox && <SmallpoxBanner/>}
      {shouldRenderEventBanner && <EventBanner />}
      
      <StickiedPosts />

      {reviewIsActive() && <SingleColumnSection>
        <FrontpageReviewWidget />
      </SingleColumnSection>}
      
      <HomeLatestPosts />
      
      {!reviewIsActive() && <RecommendationsAndCurated configName="frontpageEA" />}
      <RecentDiscussionFeed
        af={false}
        commentsLimit={recentDiscussionCommentsPerPost}
        maxAgeHours={18}
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
