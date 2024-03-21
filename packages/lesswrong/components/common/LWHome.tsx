import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { useABTest } from '../../lib/abTestImpl';
import { recombeeRecommendationsV1 } from '../../lib/abTests';
import { getRecommendationSettings } from '../recommendations/RecommendationsAlgorithmPicker';
import { useCurrentUser } from './withUser';
import { getFrontPageOverwrites } from '../recommendations/LWRecommendations';
import { RecombeeAlgorithm } from '../../lib/collections/users/recommendationSettings';

const LWHome = () => {
  const { DismissibleSpotlightItem, RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, LWRecommendations, FrontpageReviewWidget, SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection, QuickTakesSection, HomepageRecommendations } = Components
  
  const currentUser = useCurrentUser();
  const recombeeAbTest = useABTest(recombeeRecommendationsV1);
  const recommendationsBelowLatestPosts = recombeeAbTest !== 'control';
  // TODO: assign new algorithm/etc based on a/b test
  const userRecommendationSettings = getRecommendationSettings({ settings: {}, currentUser, configName: "frontpage" });
  const lwRecommendationSettings = {
    ...userRecommendationSettings,
    ...getFrontPageOverwrites(!!currentUser),
    lwRationalityOnly: false,
  };

  const recombeeRecommendationSettings: RecombeeAlgorithm = {
    source: 'recombee',
    count: 5,
    // lwRationalityOnly: lwRecommendationSettings.lwRationalityOnly,
    onlyUnread: lwRecommendationSettings.onlyUnread
  };

  const showRelocatedRecommendations = !!currentUser && recommendationsBelowLatestPosts && !lwRecommendationSettings.hideFrontpage;
  const recommendationSettings = recombeeAbTest === 'recombee' ? recombeeRecommendationSettings : lwRecommendationSettings;
  
  const [_, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie])
  
  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>

          {!reviewIsActive() && <LWRecommendations configName="frontpage" />}

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

          {showRelocatedRecommendations && <HomepageRecommendations recommendationSettings={recommendationSettings} />}

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
