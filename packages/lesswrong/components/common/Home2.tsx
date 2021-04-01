import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useLocation } from '../../lib/routeUtil';
import { isServer } from '../../lib/executionEnvironment';

const Home2 = () => {
  const { RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, RecommendationsAndCurated, GatherTown, SingleColumnSection, PermanentRedirect } = Components

  const { query } = useLocation();
  return (
      <AnalyticsContext pageContext="homePage">
        {!query?.avoidAprilFools && isServer && <PermanentRedirect url={"https://lesswrong.substack.com"} status={302} />}
        <React.Fragment>
          <SingleColumnSection>
            <AnalyticsContext pageSectionContext="gatherTownWelcome">
              <GatherTown/>
            </AnalyticsContext>
          </SingleColumnSection>
          <RecommendationsAndCurated configName="frontpage" />
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
