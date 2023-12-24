import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive } from '../../lib/publicSettings';
import { useCurrentUser } from './withUser';

const LWHome = () => {
  const { Books2021SaleAnimation, BookAnimation, Book2019Animation, Book2020Animation, RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, LWRecommendations, FrontpageReviewWidget, SingleColumnSection, FrontpageBestOfLWWidget, DialoguesList } = Components
  
  const currentUser = useCurrentUser();

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>

          {/* <Books2021SaleAnimation/> */}

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

          {currentUser && <DialoguesList currentUser={currentUser} />}

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
