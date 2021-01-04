import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const Home2 = () => {
  const { RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, FrontpageReviewPhase, BookFrontpageWidget, RecommendationsAndCurated } = Components

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          <BookFrontpageWidget />
          <FrontpageReviewPhase />
          <AnalyticsInViewTracker
              eventProps={{inViewType: "latestPosts"}}
              observerProps={{threshold:[0, 0.5, 1]}}
          >
              <HomeLatestPosts />
          </AnalyticsInViewTracker>
          <RecommendationsAndCurated configName="frontpage" />
          <AnalyticsContext pageSectionContext="recentDiscussion">
            <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
              <RecentDiscussionFeed
                af={false}
                commentsLimit={4}
                maxAgeHours={18}
              />
              { /*<RecentDiscussionThreadsList
                terms={{view: 'recentDiscussionThreadsList', limit:20}}
                commentsLimit={4}
                maxAgeHours={18}
                af={false}
              />*/ }
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
