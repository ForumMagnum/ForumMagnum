import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const Home2 = () => {
  const { RecentDiscussionFeed, HomeLatestPosts, RecommendationsAndCurated, AnalyticsInViewTracker } = Components

  return (
      <AnalyticsContext pageContext="homePage">
        <form action="/login" method="post">
          <div>
              <label>Username:</label>
              <input type="text" name="username"/>
          </div>
          <div>
              <label>Password:</label>
              <input type="password" name="password"/>
          </div>
          <div>
              <input type="submit" value="Log In"/>
          </div>
       </form>
        <React.Fragment>
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
