import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const WakingUpHome = () => {
  const { HomeLatestPosts, AnalyticsInViewTracker } = Components

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          <AnalyticsInViewTracker
              eventProps={{inViewType: "latestPosts"}}
              observerProps={{threshold:[0, 0.5, 1]}}
          >
            <HomeLatestPosts />
          </AnalyticsInViewTracker>
        </React.Fragment>
      </AnalyticsContext>
  )
}

const WakingUpHomeComponent = registerComponent('WakingUpHome', WakingUpHome);

declare global {
  interface ComponentTypes {
    WakingUpHome: typeof WakingUpHomeComponent
  }
}
