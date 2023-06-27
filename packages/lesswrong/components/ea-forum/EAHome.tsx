import React from 'react'
import { PublicInstanceSetting, isEAForum } from '../../lib/instanceSettings'
import { DatabasePublicSetting } from '../../lib/publicSettings'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { useCurrentUser } from '../common/withUser'
import { reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils'
import { maintenanceTime } from '../common/MaintenanceBanner'
import { AnalyticsContext } from '../../lib/analyticsEvents'
import Helmet from 'react-helmet'

const eaHomeSequenceIdSetting = new PublicInstanceSetting<string | null>('eaHomeSequenceId', null, "optional") // Sequence ID for the EAHomeHandbook sequence
const showSmallpoxSetting = new DatabasePublicSetting<boolean>('showSmallpox', false)
const showHandbookBannerSetting = new DatabasePublicSetting<boolean>('showHandbookBanner', false)
const showEventBannerSetting = new DatabasePublicSetting<boolean>('showEventBanner', false)
const showMaintenanceBannerSetting = new DatabasePublicSetting<boolean>('showMaintenanceBanner', false)

const EAHome = () => {
  const currentUser = useCurrentUser();
  const {
    RecentDiscussionFeed, EAHomeMainContent, RecommendationsAndCurated,
    SmallpoxBanner, EventBanner, MaintenanceBanner, FrontpageReviewWidget,
    SingleColumnSection, CurrentSpotlightItem, HomeLatestPosts, EAHomeCommunityPosts, CommentsListCondensed,
    HeadTags
  } = Components

  const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
  const shouldRenderEventBanner = showEventBannerSetting.get()
  const shouldRenderSmallpox = showSmallpoxSetting.get()
  // Only show the maintenance banner if the the current time is before the maintenance time (plus 5 minutes leeway),
  // this is just so we don't have to rush to change the server settings as soon as the maintenance is done
  const maintenanceTimeValue = maintenanceTime.get()
  const isBeforeMaintenanceTime = maintenanceTimeValue && Date.now() < new Date(maintenanceTimeValue).getTime() + (5*60*1000)
  const shouldRenderMaintenanceBanner = showMaintenanceBannerSetting.get() && isBeforeMaintenanceTime

  const shortformTerms = {
    view: "shortformFrontpage" as const
  };

  return (
    <AnalyticsContext pageContext="homePage">
      <HeadTags structuredData={{
        "@context": "http://schema.org",
      }}/>
      {shouldRenderMaintenanceBanner && <MaintenanceBanner />}
      {shouldRenderSmallpox && <SmallpoxBanner/>}
      {shouldRenderEventBanner && <EventBanner />}

      {/* <SingleColumnSection>
        <CurrentSpotlightItem />
      </SingleColumnSection> */}

      {reviewIsActive() && <SingleColumnSection>
        <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
      </SingleColumnSection>}
      
      <EAHomeMainContent FrontpageNode={
        () => <>
          <HomeLatestPosts />
          {!currentUser?.hideCommunitySection && <EAHomeCommunityPosts />}
          {isEAForum && (
            <AnalyticsContext pageSectionContext="frontpageShortform">
              <SingleColumnSection>
                <CommentsListCondensed
                  label={"Shortform"}
                  terms={shortformTerms}
                  initialLimit={5}
                  shortformButton
                />
              </SingleColumnSection>
            </AnalyticsContext>
          )}
          {!reviewIsActive() && <RecommendationsAndCurated configName="frontpageEA" />}
          <RecentDiscussionFeed
            title="Recent discussion"
            af={false}
            commentsLimit={recentDiscussionCommentsPerPost}
            maxAgeHours={18}
          />
        </>
      } />
      
    </AnalyticsContext>
  )
}

const EAHomeComponent = registerComponent('EAHome', EAHome)

declare global {
  interface ComponentTypes {
    EAHome: typeof EAHomeComponent
  }
}
