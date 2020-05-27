import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import { withDismissRecommendation } from './withDismissRecommendation';
import { captureEvent, AnalyticsContext } from '../../lib/analyticsEvents';
import * as _ from 'underscore';

const MAX_ENTRIES = 3;

interface ExternalProps {
  continueReading: any,
  continueReadingLoading?: boolean,
}
interface ContinueReadingListProps extends ExternalProps, WithUserProps {
  dismissRecommendation: any
}
interface ContinueReadingListState {
  dismissedRecommendations: Record<string,boolean>,
  showAll: boolean,
}

class ContinueReadingList extends Component<ContinueReadingListProps,ContinueReadingListState> {
  state: ContinueReadingListState = {
    dismissedRecommendations: {},
    showAll: false,
  }
  
  showAll = () => {
    this.setState({
      showAll: true
    });
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
  
  limitResumeReading(resumeReadingList: Array<any>): { entries: Array<any>, showAllLink: boolean } {
    const { dismissedRecommendations } = this.state;
    
    // Filter out dismissed recommendations
    const filtered = _.filter(resumeReadingList, r=>!dismissedRecommendations[r.nextPost._id]);
    
    // Sort by last-interaction time
    let sorted = _.sortBy(filtered, r=>r.lastReadTime);
    sorted.reverse(); //in-place
    
    // Limit to the three most recent
    if (this.state.showAll || sorted.length <= MAX_ENTRIES) {
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
  
  render() {
    const { continueReading, continueReadingLoading } = this.props;
    const { PostsItem2, PostsLoading, SectionFooter } = Components;
    if (continueReadingLoading || !continueReading)
      return <PostsLoading/>
    
    const { entries, showAllLink } = this.limitResumeReading(continueReading);

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
        {showAllLink && <SectionFooter>
          <a onClick={this.showAll}>
            Show All
          </a>
        </SectionFooter>}
      </AnalyticsContext>
    </div>
  }
}

const ContinueReadingListComponent = registerComponent<ExternalProps>('ContinueReadingList', ContinueReadingList, {
  hocs: [withDismissRecommendation, withUser]
});

declare global {
  interface ComponentTypes {
    ContinueReadingList: typeof ContinueReadingListComponent
  }
}


