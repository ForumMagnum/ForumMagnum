import React, { useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { FrontPageFeedOptions, getInitialFrontPageFeedOptions } from './FrontPageFeedOptions';

const styles = (theme: ThemeType): JssStyles => ({
  minHeightSpacerWrapper: {
    position: "relative",
    height: 0,
  },
  minHeightSpacer: {
    position: "absolute",
    height: "100vh",
    width: "100%",
  },
});

const FrontPageFeedSection = ({commentsPerPost, af, classes}: {
  commentsPerPost: number,
  af: boolean,
  classes: ClassesType,
}) => {
  const { RecentDiscussionFeed, SingleColumnSection, AnalyticsInViewTracker, FrontPageFeedOptions } = Components;
  const currentUser = useCurrentUser();
  const refetchRef = useRef<null|(()=>void)>(null);
  const [feedOptions,setFeedOptions] = useState<FrontPageFeedOptions>(getInitialFrontPageFeedOptions(currentUser));
  
  return <AnalyticsContext pageSectionContext="recentDiscussion">
    <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
      <SingleColumnSection>
        <FrontPageFeedOptions options={feedOptions} setOptions={setFeedOptions} refetchRef={refetchRef} />

        <div className={classes.minHeightSpacerWrapper}>
          <div className={classes.minHeightSpacer}/>
        </div>

        <RecentDiscussionFeed
          magicMode={feedOptions.mode === "magic"}
          af={af}
          commentsLimit={commentsPerPost}
          maxAgeHours={18}
          refetchRef={refetchRef}
        />
      </SingleColumnSection>
    </AnalyticsInViewTracker>
  </AnalyticsContext>
}

const FrontPageFeedSectionComponent = registerComponent('FrontPageFeedSection', FrontPageFeedSection, {styles});

declare global {
  interface ComponentTypes {
    FrontPageFeedSection: typeof FrontPageFeedSectionComponent
  }
}

