import React from 'react'
import { PublicInstanceSetting, isEAForum } from '../../lib/instanceSettings'
import { DatabasePublicSetting } from '../../lib/publicSettings'
import { Components, combineUrls, getSiteUrl, registerComponent } from '../../lib/vulcan-lib'
import { useCurrentUser } from '../common/withUser'
import { reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils'
import { maintenanceTime } from '../common/MaintenanceBanner'
import { AnalyticsContext } from '../../lib/analyticsEvents'

const eaHomeSequenceIdSetting = new PublicInstanceSetting<string | null>('eaHomeSequenceId', null, "optional") // Sequence ID for the EAHomeHandbook sequence
const showSmallpoxSetting = new DatabasePublicSetting<boolean>('showSmallpox', false)
const showHandbookBannerSetting = new DatabasePublicSetting<boolean>('showHandbookBanner', false)
const showEventBannerSetting = new DatabasePublicSetting<boolean>('showEventBanner', false)
const showMaintenanceBannerSetting = new DatabasePublicSetting<boolean>('showMaintenanceBanner', false)

/**
 * Build structured data to help with SEO.
 */
const getStructuredData = () => ({
  "@context": "http://schema.org",
  "@type": "WebSite",
  "url": `${getSiteUrl()}`,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${combineUrls(getSiteUrl(), '/search')}?query={search_term_string}`,
    "query-input": "required name=search_term_string"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `${getSiteUrl()}`,
  },
  ...(isEAForum && {
    "description": [
      "A forum for discussions and updates on effective altruism. Topics covered include",
      "global health, AI safety, biosecurity, animal welfare, philosophy, policy, forecasting,",
      "and effective giving. Users can explore new posts, engage with the community,",
      "participate in recent discussions, and discover topics, events,",
      "and groups. An accessible space for sharing and learning about approaches to tackling",
      "the world's most pressing problems."
    ].join(' ')
  }),
})


const EAHome = () => {
  const currentUser = useCurrentUser();
  const {
    RecentDiscussionFeed, EAHomeMainContent, QuickTakesSection,
    SmallpoxBanner, EventBanner, MaintenanceBanner, FrontpageReviewWidget,
    SingleColumnSection, HomeLatestPosts, EAHomeCommunityPosts, HeadTags,
    EAPopularCommentsSection,
  } = Components

  const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
  const shouldRenderEventBanner = showEventBannerSetting.get()
  const shouldRenderSmallpox = showSmallpoxSetting.get()
  // Only show the maintenance banner if the the current time is before the maintenance time (plus 5 minutes leeway),
  // this is just so we don't have to rush to change the server settings as soon as the maintenance is done
  const maintenanceTimeValue = maintenanceTime.get()
  const isBeforeMaintenanceTime = maintenanceTimeValue && Date.now() < new Date(maintenanceTimeValue).getTime() + (5*60*1000)
  const shouldRenderMaintenanceBanner = showMaintenanceBannerSetting.get() && isBeforeMaintenanceTime

  return (
    <AnalyticsContext pageContext="homePage">
      <HeadTags structuredData={getStructuredData()}/>
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
          {isEAForum && <QuickTakesSection />}
          {isEAForum && <EAPopularCommentsSection />}
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
