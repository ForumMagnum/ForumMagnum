import React, { useEffect } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive, lightconeFundraiserThermometerGoalAmount, lightconeFundraiserActive } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { isLW, isAF } from '@/lib/instanceSettings';
import { useCurrentUser } from './withUser';
import { combineUrls, getSiteUrl } from "../../lib/vulcan-lib/utils";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import TreasureChestOpening from './TreasureChestOpening';
import BuyButton from '../loot/BuyButton';
import ConvertLWBucksButton from '../loot/ConvertLWBucksButton';
import { defineStyles, useStyles } from '../hooks/useStyles';

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
  ...(isLW && {
    "description": [
      "LessWrong is an online forum and community dedicated to improving human reasoning and decision-making.", 
      "We seek to hold true beliefs and to be effective at accomplishing our goals.", 
      "Each day, we aim to be less wrong about the world than the day before."
    ].join(' ')
  }),
  ...(isAF && {
    "description": [
      "The Alignment Forum is a single online hub for researchers to discuss all ideas related to ensuring that transformatively powerful AIs are aligned with human values.", 
      "Discussion ranges from technical models of agency to the strategic landscape, and everything in between."
    ].join(' ')
  }),
})

const styles = defineStyles('LWHome', (theme: ThemeType) => ({
  ctaButtons: {
    display: 'flex',
    gap: '10px',
  },
}));

const LWHome = () => {
  const { DismissibleSpotlightItem, RecentDiscussionFeed, AnalyticsInViewTracker, FrontpageReviewWidget,
    SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection, FundraisingThermometer,
    QuickTakesSection, LWHomePosts, HeadTags
  } = Components;

  const currentUser = useCurrentUser();
  const classes = useStyles(styles);
  
  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          <HeadTags structuredData={getStructuredData()}/>
          <UpdateLastVisitCookie />
          {reviewIsActive() && <>
            {getReviewPhase() !== "RESULTS" && <SingleColumnSection>
              <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
            </SingleColumnSection>}
          </>}
          <TreasureChestOpening />
          {/* <div className={classes.ctaButtons}>
            <BuyButton />
            <ConvertLWBucksButton />
          </div> */}
          {(!reviewIsActive() || getReviewPhase() === "RESULTS" || !showReviewOnFrontPageIfActive.get()) && !lightconeFundraiserActive.get() && <SingleColumnSection>

            {/* <DismissibleSpotlightItem current/> */}
          </SingleColumnSection>}
          <AnalyticsInViewTracker
            eventProps={{inViewType: "homePosts"}}
            observerProps={{threshold:[0, 0.5, 1]}}
          >
            <LWHomePosts>
              <QuickTakesSection />
    
              <EAPopularCommentsSection />
    
              <RecentDiscussionFeed
                af={false}
                commentsLimit={4}
                maxAgeHours={18}
              />
            </LWHomePosts>
          </AnalyticsInViewTracker>
        </React.Fragment>
      </AnalyticsContext>
  )
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

const LWHomeComponent = registerComponent('LWHome', LWHome);

declare global {
  interface ComponentTypes {
    LWHome: typeof LWHomeComponent
  }
}
