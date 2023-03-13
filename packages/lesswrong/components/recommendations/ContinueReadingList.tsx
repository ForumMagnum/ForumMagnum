import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDismissRecommendation } from './withDismissRecommendation';
import { captureEvent, AnalyticsContext } from '../../lib/analyticsEvents';
import * as _ from 'underscore';

const MAX_ENTRIES = 3;

const ContinueReadingList = ({ continueReading, continueReadingLoading }: {
  continueReading: any,
  continueReadingLoading?: boolean,
}) => {
  const dismissRecommendation = useDismissRecommendation();
  const [dismissedRecommendations, setDismissedRecommendations] = useState<any>({});
  const [showAll, setShowAll] = useState(false);
  
  const dismissAndHideRecommendation = (postId: string) => {
    void dismissRecommendation(postId);
    setDismissedRecommendations({
      ...dismissedRecommendations,
      [postId]: true
    });
    captureEvent("continueReadingDismissed", {"postId": postId});
  }
  
  const limitResumeReading = (resumeReadingList: Array<any>): { entries: Array<any>, showAllLink: boolean } => {
    // Filter out dismissed recommendations
    const filtered = _.filter(resumeReadingList, r=>!dismissedRecommendations[r.nextPost._id]);
    
    // Sort by last-interaction time
    let sorted = _.sortBy(filtered, r=>r.lastReadTime);
    sorted.reverse(); //in-place
    
    // Limit to the three most recent
    if (showAll || sorted.length <= MAX_ENTRIES) {
      return {
        entries: sorted,
        showAllLink: false,
      };
    } else {
      return {
        entries: sorted.slice(0, MAX_ENTRIES),
        showAllLink: true,
      }
    }
  }

  const { PostsItem, PostsLoading, SectionFooter } = Components;
  if (continueReadingLoading || !continueReading)
    return <PostsLoading/>

  const { entries, showAllLink } = limitResumeReading(continueReading);

  return <div>
    <AnalyticsContext listContext={"continueReading"} capturePostItemOnMount>
      {entries.map(resumeReading => {
        const { nextPost, sequence, collection } = resumeReading;
        return <PostsItem
          post={nextPost}
          sequenceId={sequence?._id}
          resumeReading={resumeReading}
          dismissRecommendation={() => dismissAndHideRecommendation(nextPost._id)}
          key={sequence?._id || collection?._id}
        />
      })}
      {showAllLink && <SectionFooter>
        <a onClick={() => setShowAll(true)}>
          Show All
        </a>
      </SectionFooter>}
    </AnalyticsContext>
  </div>
}

const ContinueReadingListComponent = registerComponent('ContinueReadingList', ContinueReadingList);

declare global {
  interface ComponentTypes {
    ContinueReadingList: typeof ContinueReadingListComponent
  }
}


