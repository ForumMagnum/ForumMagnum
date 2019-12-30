import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { withDismissRecommendation } from './withDismissRecommendation';
import { captureEvent, AnalyticsContext } from '../../lib/analyticsEvents.js';

const MAX_ENTRIES = 3;

class ContinueReadingList extends Component {
  state = {
    dismissedRecommendations: {},
  }

  dismissAndHideRecommendation(postId) {
    this.props.dismissRecommendation({postId: postId});
    this.setState({
      dismissedRecommendations: {
        ...this.state.dismissedRecommendations,
        [postId]: true
      }
    });
    captureEvent("continueReadingDismissed", {"postId": postId});
  }
  
  limitResumeReading(resumeReadingList) {
    const { dismissedRecommendations } = this.state;
    
    // Filter out dismissed recommendations
    const filtered = _.filter(resumeReadingList, r=>!dismissedRecommendations[r.nextPost._id]);
    
    // Sort by last-interaction time
    let sorted = _.sortBy(filtered, r=>r.lastReadTime);
    sorted.reverse(); //in-place
    
    // Limit to the three most recent
    if (sorted.length <= MAX_ENTRIES) {
      return {
        entries: sorted,
      };
    } else {
      return {
        entries: sorted.slice(0, MAX_ENTRIES),
      }
    }
  } 
  
  render() {
    const { continueReading, continueReadingLoading } = this.props;
    const { PostsItem2, PostsLoading } = Components;
    if (continueReadingLoading || !continueReading)
      return <PostsLoading/>
    
    const { entries } = this.limitResumeReading(continueReading);

    return <div>
      <AnalyticsContext listContext={"continueReading"} capturePostItemOnMount>
        {entries.map(resumeReading => {
          const { nextPost, sequence, collection } = resumeReading;
          return <PostsItem2
            post={nextPost}
            sequenceId={sequence?._id}
            resumeReading={resumeReading}
            dismissRecommendation={() => this.dismissAndHideRecommendation(nextPost._id)}
            key={sequence?._id || collection?._id}
          />
        })}
      </AnalyticsContext>
    </div>
  }
}

registerComponent('ContinueReadingList', ContinueReadingList,
  withDismissRecommendation,
  withUser
);

