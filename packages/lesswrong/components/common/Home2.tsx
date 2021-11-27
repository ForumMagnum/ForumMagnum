import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import moment from 'moment';
import { annualReviewStart, annualReviewEnd } from '../../lib/publicSettings';

const Home2 = () => {
  const { RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, RecommendationsAndCurated, FrontpageReviewWidget } = Components

  const reviewIsActive = moment(annualReviewStart.get()) < moment() && moment() < moment(annualReviewEnd.get())

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          {!reviewIsActive && <RecommendationsAndCurated configName="frontpage" />}
          {reviewIsActive && <FrontpageReviewWidget />}
          <AnalyticsInViewTracker
              eventProps={{inViewType: "latestPosts"}}
              observerProps={{threshold:[0, 0.5, 1]}}
          >
            <HomeLatestPosts />
          </AnalyticsInViewTracker>
          <AnalyticsContext pageSectionContext="recentDiscussion">
            <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
              <RecentDiscussionFeed
                af={false}  
                commentsLimit={4}
                maxAgeHours={18}
              />
            </AnalyticsInViewTracker>
          </AnalyticsContext>
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
