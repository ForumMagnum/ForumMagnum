'use client';

import React, { useEffect } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive, lightconeFundraiserActive, ultraFeedEnabledSetting, isLW, isAF } from '@/lib/instanceSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { combineUrls, getSiteUrl } from "../../lib/vulcan-lib/utils";
import { registerComponent } from "../../lib/vulcan-lib/components";
import AnalyticsInViewTracker from "./AnalyticsInViewTracker";
import FrontpageReviewWidget from "../review/FrontpageReviewWidget";
import SingleColumnSection from "./SingleColumnSection";
import DismissibleSpotlightItem from "@/components/spotlights/DismissibleSpotlightItem";
import QuickTakesSection from "../quickTakes/QuickTakesSection";
import LWHomePosts from "./LWHomePosts";
import UltraFeed from "../ultraFeed/UltraFeed";
import { StructuredData } from './StructuredData';
import { SuspenseWrapper } from './SuspenseWrapper';
import DeferRender from './DeferRender';

import dynamic from 'next/dynamic';
import { IsReturningVisitorContextProvider } from '@/components/layout/IsReturningVisitorContextProvider';
import FundraisingThermometer from './FundraisingThermometer';
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
  return (
      <AnalyticsContext pageContext="homePage">
        <StructuredData generate={() => getStructuredData()}/>
        <UpdateLastVisitCookie />
        {reviewIsActive() && <>
          {getReviewPhase() !== "RESULTS" && <SingleColumnSection>
            <SuspenseWrapper name="FrontpageReviewWidget">
              <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
            </SuspenseWrapper>
          </SingleColumnSection>}
        </>}
        {lightconeFundraiserActive.get() && <SingleColumnSection>
          <FundraisingThermometer />
        </SingleColumnSection>}
        {(!reviewIsActive() || getReviewPhase() === "RESULTS" || !showReviewOnFrontPageIfActive.get()) && !lightconeFundraiserActive.get() && <SingleColumnSection>
          <DismissibleSpotlightItem loadingStyle="placeholder" />
        </SingleColumnSection>}
        <SuspenseWrapper name="LWHomePosts" fallback={<div style={{height: 800}}/>}>
          <IsReturningVisitorContextProvider>
            <LWHomePosts>
              <QuickTakesSection />

              <AnalyticsInViewTracker eventProps={{inViewType: "feedSection"}} observerProps={{threshold:[0, 0.5, 1]}}>
                <SuspenseWrapper name="UltraFeed">
                  <UltraFeedOrRecentDiscussion/>
                </SuspenseWrapper>
              </AnalyticsInViewTracker>
            </LWHomePosts>
          </IsReturningVisitorContextProvider>
        </SuspenseWrapper>
      </AnalyticsContext>
  )
}

const UltraFeedOrRecentDiscussion = () => {
  const ultraFeedEnabled = ultraFeedEnabledSetting.get()
  
  return ultraFeedEnabled
    ? <UltraFeed />
    : <DeferRender ssr={false}>
        <RecentDiscussionFeed
          af={false}
          commentsLimit={4}
          maxAgeHours={18}
        />
      </DeferRender>
}

const UpdateLastVisitCookie = () => {
  const [_, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie])

  return <></>
}

export default registerComponent('LWHome', LWHome, {
  areEqual: "auto",
});


