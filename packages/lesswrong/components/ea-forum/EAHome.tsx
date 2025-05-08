import React, { useCallback } from 'react'
import { isBotSiteSetting, isEAForum } from '../../lib/instanceSettings'
import { DatabasePublicSetting } from '../../lib/publicSettings'
import { useCurrentUser } from '../common/withUser'
import { maintenanceTime, MaintenanceBanner } from '../common/MaintenanceBanner'
import { AnalyticsContext } from '../../lib/analyticsEvents'
import DeferRender from '../common/DeferRender'
import { registerComponent } from "../../lib/vulcan-lib/components";
import { combineUrls, getSiteUrl } from "../../lib/vulcan-lib/utils";
import { RecentDiscussionFeed } from "../recentDiscussion/RecentDiscussionFeed";
import { QuickTakesSection } from "../quickTakes/QuickTakesSection";
import { DismissibleSpotlightItem } from "../spotlights/DismissibleSpotlightItem";
import { HomeLatestPosts } from "../common/HomeLatestPosts";
import { EAHomeCommunityPosts } from "./EAHomeCommunityPosts";
import { EAPopularCommentsSection } from "./EAPopularCommentsSection";
import { EAHomeMainContent } from "./EAHomeMainContent";
import { SmallpoxBanner } from "./SmallpoxBanner";
import { EventBanner } from "./EventBanner";
import { HeadTags } from "../common/HeadTags";
import { BotSiteBanner } from "../common/BotSiteBanner";
import { EAGBanner } from "./EAGBanner";

const showSmallpoxSetting = new DatabasePublicSetting<boolean>('showSmallpox', false)
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

const styles = (_theme: ThemeType) => ({
  spotlightMargin: {
    marginBottom: 24,
  },
});

const FrontpageNode = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const currentUser = useCurrentUser();
  const recentDiscussionCommentsPerPost = currentUser && currentUser.isAdmin ? 4 : 3;
  return (
    <>
      <DismissibleSpotlightItem current className={classes.spotlightMargin} />
      <HomeLatestPosts />
      <DeferRender ssr={true} clientTiming="mobile-aware">
        {!currentUser?.hideCommunitySection && <EAHomeCommunityPosts />}
        <QuickTakesSection />
      </DeferRender>
      <DeferRender ssr={!!currentUser} clientTiming="mobile-aware">
        <EAPopularCommentsSection />
      </DeferRender>
      <DeferRender ssr={!!currentUser} clientTiming="async-non-blocking">
        <RecentDiscussionFeed
          title="Recent discussion"
          af={false}
          commentsLimit={recentDiscussionCommentsPerPost}
          maxAgeHours={18}
        />
      </DeferRender>
    </>
  );
};

const EAHomeInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const shouldRenderEventBanner = showEventBannerSetting.get()
  const shouldRenderSmallpox = showSmallpoxSetting.get()
  // Only show the maintenance banner if the the current time is before the maintenance time (plus 5 minutes leeway),
  // this is just so we don't have to rush to change the server settings as soon as the maintenance is done
  const maintenanceTimeValue = maintenanceTime.get()
  const isBeforeMaintenanceTime = maintenanceTimeValue && Date.now() < new Date(maintenanceTimeValue).getTime() + (5*60*1000)
  const shouldRenderMaintenanceBanner = showMaintenanceBannerSetting.get() && isBeforeMaintenanceTime
  const shouldRenderBotSiteBanner = isBotSiteSetting.get() && isEAForum

  const FrontpageNodeWithClasses = useCallback(
    () => <FrontpageNode classes={classes} />,
    [classes],
  );
  return (
    <AnalyticsContext pageContext="homePage">
      <HeadTags structuredData={getStructuredData()}/>
      {shouldRenderMaintenanceBanner && <MaintenanceBanner />}
      {shouldRenderSmallpox && <SmallpoxBanner/>}
      {shouldRenderEventBanner && <EventBanner />}
      {shouldRenderBotSiteBanner && <BotSiteBanner />}
      <EAGBanner />
      <EAHomeMainContent FrontpageNode={FrontpageNodeWithClasses} />
    </AnalyticsContext>
  )
}

export const EAHome = registerComponent('EAHome', EAHomeInner, {styles});

declare global {
  interface ComponentTypes {
    EAHome: typeof EAHome
  }
}
