import React, { useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { getInitialFrontPageFeedOptions } from './FrontPageFeedOptions';

const FrontPageFeedSection = ({commentsPerPost, af}: {
  commentsPerPost: number,
  af: boolean,
  classes: ClassesType,
}) => {
  const { RecentDiscussionFeed, SingleColumnSection, AnalyticsInViewTracker, FrontPageFeedOptions } = Components;
  const currentUser = useCurrentUser();
  const refetchRef = useRef<null|(()=>void)>(null);
  const [feedOptions,setFeedOptions] = useState(getInitialFrontPageFeedOptions(currentUser));
  
  return <AnalyticsContext pageSectionContext="recentDiscussion">
    <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
      <SingleColumnSection>
        <FrontPageFeedOptions options={feedOptions} setOptions={setFeedOptions} refetchRef={refetchRef} />

        <RecentDiscussionFeed
          af={af}
          commentsLimit={commentsPerPost}
          maxAgeHours={18}
          refetchRef={refetchRef}
        />
      </SingleColumnSection>
    </AnalyticsInViewTracker>
  </AnalyticsContext>
}

const FrontPageFeedSectionComponent = registerComponent('FrontPageFeedSection', FrontPageFeedSection);

declare global {
  interface ComponentTypes {
    FrontPageFeedSection: typeof FrontPageFeedSectionComponent
  }
}

