import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDismissRecommendation } from './withDismissRecommendation';
import { captureEvent, AnalyticsContext } from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import { ContinueReading } from './withContinueReading';
import { PostsItem } from "../posts/PostsItem";
import { PostsLoading } from "../posts/PostsLoading";
import { SectionFooter } from "../common/SectionFooter";

const ContinueReadingListInner = ({ continueReading, continueReadingLoading, limit=3, shuffle }: {
  continueReading: ContinueReading[],
  continueReadingLoading?: boolean,
  limit?: number,
  // randomly select posts from your reading list if your reading list is longer than the limit
  shuffle?: boolean,
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
  
  const limitResumeReading = (resumeReadingList: ContinueReading[]): { entries: ContinueReading[], showAllLink: boolean } => {
    // Filter out dismissed recommendations
    const filtered = _.filter(resumeReadingList, r=>!dismissedRecommendations[r.nextPost._id]);
    
    // Sort by last-interaction time
    let sorted = _.sortBy(filtered, r=>r.lastReadTime);
    sorted.reverse(); //in-place
    
    // Limit to the three most recent
    if (showAll || sorted.length <= limit) {
      return {
        entries: sorted,
        showAllLink: false,
      };
    } else if (shuffle) {
      const sampled = _.sample(sorted, limit) as ContinueReading[]; // _.sample doesn't preserve type
      sorted = _.sortBy(sampled, r =>r.lastReadTime); // need to sort again because _.sample doesn't guarantee order
      sorted.reverse();
      return {
        entries: sorted,
        showAllLink: true,
      }
    } else {
      return {
        entries: sorted.slice(0, limit),
        showAllLink: true,
      }
    }
  }
  if (continueReadingLoading || !continueReading)
    return <PostsLoading/>

  const { entries, showAllLink } = limitResumeReading(continueReading);

  return <div>
    <AnalyticsContext pageSubSectionContext="continueReadingList" capturePostItemOnMount>
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

export const ContinueReadingList = registerComponent('ContinueReadingList', ContinueReadingListInner);




