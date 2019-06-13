import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { withDismissRecommendation } from './withDismissRecommendation';

class ContinueReadingList extends Component {
  state = {
    dismissedRecommendations: {}
  }
  
  dismissAndHideRecommendation(postId) {
    this.props.dismissRecommendation({postId: postId});
    this.setState({
      dismissedRecommendations: {
        ...this.state.dismissedRecommendations,
        [postId]: true
      }
    });
  }
  
  limitResumeReading(resumeReadingList) {
    const { dismissedRecommendations } = this.state;
    // Filter out dismissed recommendations
    const filtered = _.filter(resumeReadingList, r=>!dismissedRecommendations[r.nextPost._id]);
    // Sort by last-interaction time
    let sorted = _.sortBy(filtered, r=>r.lastReadTime);
    sorted.reverse(); //in-place
    // Limit to the three most recent
    const maxEntries = 3;
    if (sorted.length < maxEntries) return sorted;
    return sorted.slice(0, maxEntries);
  }
  
  render() {
    const { continueReading, continueReadingLoading } = this.props;
    const { PostsItem2, PostsLoading } = Components;
    if (continueReadingLoading || !continueReading)
      return <PostsLoading/>
    
    const resumeReadingList = this.limitResumeReading(continueReading);
    
    return <div>
      {resumeReadingList.map(resumeReading => {
        const { nextPost, sequence, collection } = resumeReading;
        return <PostsItem2
          post={nextPost}
          sequenceId={sequence?._id}
          resumeReading={resumeReading}
          dismissRecommendation={() => this.dismissAndHideRecommendation(nextPost._id)}
          key={sequence?._id || collection?._id}
        />
      })}
    </div>
  }
}

registerComponent('ContinueReadingList', ContinueReadingList,
  withDismissRecommendation,
  withUser
);

