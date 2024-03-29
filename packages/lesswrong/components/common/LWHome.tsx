import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { recombeeEnabledSetting, showReviewOnFrontPageIfActive } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { userHasRecombeeFrontpage, visitorGetsDynamicFrontpage } from '../../lib/betas';
import { useCurrentUser } from './withUser';

const LWHome = () => {
  const { DismissibleSpotlightItem, RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, LWRecommendations, 
    FrontpageReviewWidget, SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection, QuickTakesSection } = Components
  const [_, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie])

  const currentUser = useCurrentUser()
  const recombeeFrontpagePrototypeEnabled = userHasRecombeeFrontpage(currentUser)
  
  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>

          {recombeeFrontpagePrototypeEnabled && <SingleColumnSection>
            <DismissibleSpotlightItem current/>
          </SingleColumnSection>}
          {!recombeeFrontpagePrototypeEnabled && !reviewIsActive() && <LWRecommendations configName="frontpage" />}

          {reviewIsActive() && getReviewPhase() === "RESULTS" && <SingleColumnSection>
            <FrontpageBestOfLWWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
        
          {reviewIsActive() && getReviewPhase() !== "RESULTS" && showReviewOnFrontPageIfActive.get() && <SingleColumnSection>
            <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          
          <AnalyticsInViewTracker
              eventProps={{inViewType: "latestPosts"}}
              observerProps={{threshold:[0, 0.5, 1]}}
          >
            <HomeLatestPosts />
          </AnalyticsInViewTracker>

          <QuickTakesSection />

          <EAPopularCommentsSection />

          <RecentDiscussionFeed
            af={false}
            commentsLimit={4}
            maxAgeHours={18}
          />
        </React.Fragment>
      </AnalyticsContext>
  )
}

const LWHomeComponent = registerComponent('LWHome', LWHome);

declare global {
  interface ComponentTypes {
    LWHome: typeof LWHomeComponent
  }
}
