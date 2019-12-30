import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const Home2 = () => {
  const currentUser = useCurrentUser();
  const { RecentDiscussionThreadsList, HomeLatestPosts, RecommendationsAndCurated } = Components

  const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          {shouldRenderSidebar && <Components.SunshineSidebar/>}
          <RecommendationsAndCurated configName="frontpage" />
          <HomeLatestPosts />
          <AnalyticsContext pageSectionContext="recentDiscussion">
              <RecentDiscussionThreadsList
                terms={{view: 'recentDiscussionThreadsList', limit:20}}
                commentsLimit={4}
                maxAgeHours={18}
                af={false}
              />
          </AnalyticsContext>
        </React.Fragment>
      </AnalyticsContext>
  )
}

registerComponent('Home2', Home2);
