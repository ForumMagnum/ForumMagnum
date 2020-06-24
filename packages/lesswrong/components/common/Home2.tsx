import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const Home2 = () => {
  const currentUser = useCurrentUser();
  const { RecentDiscussionThreadsList, HomeLatestPosts, RecommendationsAndCurated, AnalyticsInViewTracker, ContentArea } = Components

  const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          {shouldRenderSidebar && <Components.SunshineSidebar/>}
          <ContentArea>
            <RecommendationsAndCurated configName="frontpage" />
            <AnalyticsInViewTracker
                eventProps={{inViewType: "latestPosts"}}
                observerProps={{threshold:[0, 0.5, 1]}}
            >
                <HomeLatestPosts />
            </AnalyticsInViewTracker>
            <AnalyticsContext pageSectionContext="recentDiscussion">
                <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
                    <RecentDiscussionThreadsList
                      terms={{view: 'recentDiscussionThreadsList', limit:20}}
                      commentsLimit={4}
                      maxAgeHours={18}
                      af={false}
                    />
                </AnalyticsInViewTracker>
            </AnalyticsContext>
          </ContentArea>
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
