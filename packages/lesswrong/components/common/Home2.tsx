import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';

const Home2 = () => {
  const { RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, RecommendationsAndCurated, FrontpageReviewWidget, SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection } = Components

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>

          {!reviewIsActive() && <RecommendationsAndCurated configName="frontpage" />}

          {reviewIsActive() && getReviewPhase() === "RESULTS" && <SingleColumnSection>
            <FrontpageBestOfLWWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
        
          {reviewIsActive() && getReviewPhase() !== "RESULTS" && <SingleColumnSection>
            <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          
          <AnalyticsInViewTracker
              eventProps={{inViewType: "latestPosts"}}
              observerProps={{threshold:[0, 0.5, 1]}}
          >
            <HomeLatestPosts />
          </AnalyticsInViewTracker>

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

const Home2Component = registerComponent('Home2', Home2);

declare global {
  interface ComponentTypes {
    Home2: typeof Home2Component
  }
}
