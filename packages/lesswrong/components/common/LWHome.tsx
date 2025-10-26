'use client';

import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive, lightconeFundraiserActive, ultraFeedEnabledSetting, isLW, isAF } from '@/lib/instanceSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE } from '../../lib/cookies/cookies';
import { combineUrls, getSiteUrl } from "../../lib/vulcan-lib/utils";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useABTest } from '@/components/hooks/useAbTests';
import { ultraFeedABTest } from '../../lib/abTests';
import AnalyticsInViewTracker from "./AnalyticsInViewTracker";
import FrontpageReviewWidget from "../review/FrontpageReviewWidget";
import SingleColumnSection from "./SingleColumnSection";
import EAPopularCommentsSection from "../ea-forum/EAPopularCommentsSection";
import DismissibleSpotlightItem from "../spotlights/DismissibleSpotlightItem";
import QuickTakesSection from "../quickTakes/QuickTakesSection";
import LWHomePosts from "./LWHomePosts";
import UltraFeed from "../ultraFeed/UltraFeed";
import { StructuredData } from './StructuredData';
import { SuspenseWrapper } from './SuspenseWrapper';
import DeferRender from './DeferRender';

import dynamic from 'next/dynamic';
import { IsReturningVisitorContextProvider } from './IsReturningVisitorContextProvider';
const RecentDiscussionFeed = dynamic(() => import("../recentDiscussion/RecentDiscussionFeed"), { ssr: false });

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
  ...(isLW() && {
    "description": [
      "LessWrong is an online forum and community dedicated to improving human reasoning and decision-making.", 
      "We seek to hold true beliefs and to be effective at accomplishing our goals.", 
      "Each day, we aim to be less wrong about the world than the day before."
    ].join(' ')
  }),
  ...(isAF() && {
    "description": [
      "The Alignment Forum is a single online hub for researchers to discuss all ideas related to ensuring that transformatively powerful AIs are aligned with human values.", 
      "Discussion ranges from technical models of agency to the strategic landscape, and everything in between."
    ].join(' ')
  }),
})

const LWHome = () => {
  const abTestGroup = useABTest(ultraFeedABTest);
  const [cookies] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  
  // Check if user has already made a choice via checkbox (which sets a cookie)
  const cookieValue = cookies[ULTRA_FEED_ENABLED_COOKIE];
  const hasExplicitPreference = cookieValue === "true" || cookieValue === "false";
  
  // Determine which feed to show: if cookie is set, use that preference, otherwise use A/B test assignment
  const shouldShowUltraFeed = ultraFeedEnabledSetting.get() && (cookieValue === "true" || (!hasExplicitPreference && abTestGroup === 'ultraFeed'));

  return (
      <AnalyticsContext pageContext="homePage">
        <IsReturningVisitorContextProvider>
          <StructuredData generate={() => getStructuredData()}/>
          {reviewIsActive() && <>
            {getReviewPhase() !== "RESULTS" && <SingleColumnSection>
              <SuspenseWrapper name="FrontpageReviewWidget">
                <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
              </SuspenseWrapper>
            </SingleColumnSection>}
          </>}
          {(!reviewIsActive() || getReviewPhase() === "RESULTS" || !showReviewOnFrontPageIfActive.get()) && !lightconeFundraiserActive.get() && <SingleColumnSection>
            <DismissibleSpotlightItem loadingStyle="placeholder" />
          </SingleColumnSection>}
          <SuspenseWrapper name="LWHomePosts" fallback={<div style={{height: 800}}/>}>
            <LWHomePosts>
              <QuickTakesSection />
              <SuspenseWrapper name="EAPopularCommentsSection">
                <EAPopularCommentsSection />
              </SuspenseWrapper>
              
              <AnalyticsInViewTracker eventProps={{inViewType: "feedSection"}} observerProps={{threshold:[0, 0.5, 1]}}>
                <SuspenseWrapper name="UltraFeed">
                  {shouldShowUltraFeed && <UltraFeed />}
                  {!shouldShowUltraFeed && <DeferRender ssr={false}>
                    <RecentDiscussionFeed
                      af={false}
                      commentsLimit={4}
                      maxAgeHours={18}
                    />
                  </DeferRender>}
                </SuspenseWrapper>
              </AnalyticsInViewTracker>

            </LWHomePosts>
          </SuspenseWrapper>
        </IsReturningVisitorContextProvider>
      </AnalyticsContext>
  )
}

export default registerComponent('LWHome', LWHome, {
  areEqual: "auto",
});


