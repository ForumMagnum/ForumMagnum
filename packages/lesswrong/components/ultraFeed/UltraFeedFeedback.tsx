import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { DisplayFeedCommentThread } from './ultraFeedTypes';
import Loading from '../vulcan-core/Loading';
import UltraFeedThreadItem from './UltraFeedThreadItem';
import FeedItemWrapper from './FeedItemWrapper';
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';

const FEEDBACK_COMMENT_ID = 'ohpqfKn7qWBZkeRbM';

const styles = defineStyles("UltraFeedFeedback", (theme: ThemeType) => ({
  feedbackContainer: {
    // marginTop: 16,
    marginBottom: 32,
  },
}));

const SingleCommentQuery = gql(`
  query SingleCommentForFeedback($documentId: String!) {
    comment(input: { selector: { _id: $documentId } }) {
      result {
        ...UltraFeedComment
      }
    }
  }
`);

const UltraFeedFeedback = () => {
  const classes = useStyles(styles);

  const { data, loading } = useQuery(SingleCommentQuery, {
    variables: { documentId: FEEDBACK_COMMENT_ID },
  });

  const comment = data?.comment?.result;

  if (loading) {
    return <div className={classes.feedbackContainer}><Loading /></div>;
  }
  if (!comment || !comment._id) {
    return <div className={classes.feedbackContainer}>Error loading feedback comment.</div>;
  }
  
  const thread: DisplayFeedCommentThread = {
    _id: comment._id,
    comments: [comment as UltraFeedComment],
    commentMetaInfos: {
      [comment._id]: {
        displayStatus: 'expanded',
        sources: [],
        descendentCount: 0,
        directDescendentCount: 0,
        highlight: false,
        lastServed: new Date(),
        lastViewed: null,
        lastInteracted: null,
        postedAt: comment.postedAt ? new Date(comment.postedAt) : new Date(),
        servedEventId: 'feedback-comment',
      },
    },
  };
    
  const settings: UltraFeedSettingsType = {
    ...DEFAULT_SETTINGS,
    displaySettings: {
      ...DEFAULT_SETTINGS.displaySettings,
      commentExpandedInitialWords: 50
    },
  };

  return (
    <div className={classes.feedbackContainer}>
      <UltraFeedThreadItem thread={thread} index={0} settings={settings} startReplyingTo={comment._id}/>
    </div>
  );
};

export default UltraFeedFeedback; 
