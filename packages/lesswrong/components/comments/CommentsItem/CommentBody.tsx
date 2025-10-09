import React from 'react';
import classNames from 'classnames';
import { commentExcerptFromHTML } from '../../../lib/editor/ellipsize'
import { useFilteredCurrentUser } from '../../common/withUser'
import { nofollowKarmaThreshold } from '@/lib/instanceSettings';
import ContentStyles from '../../common/ContentStyles';
import { VotingProps } from '../../votes/votingProps';
import { ContentItemBody } from '../../contents/ContentItemBody';
import { type ContentItemBodyImperative, type ContentReplacedSubstringComponentInfo } from '../../contents/contentBodyUtil';

import { getVotingSystemByName } from '../../../lib/voting/getVotingSystem';
import CommentDeletedMetadata from "./CommentDeletedMetadata";
import SelectedTextToolbarWrapper from "../../votes/lwReactions/InlineReactSelectionWrapper";
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import { CommentTreeOptions } from '../commentTree';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useAddInlinePredictions } from '@/components/votes/lwReactions/AddClaimProbabilityButton';
import { inlinePredictionsToReplacements } from '@/components/votes/InlinePrediction';

const styles = defineStyles("CommentBody", (theme: ThemeType) => ({
  commentStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
  },
  answerStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
    '& .read-more-button a, & .read-more-button a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    },
    marginBottom: ".5em"
  },
  root: {
    position: "relative",
    '& .read-more-button': {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    }
  },
  retracted: {
    textDecoration: "line-through",
  },
}))

const CommentBody = ({
  comment,
  commentBodyRef,
  collapsed,
  truncated,
  postPage,
  voteProps,
  className,
}: {
  comment: CommentsList,
  commentBodyRef?: React.RefObject<ContentItemBodyImperative|null>|null,
  collapsed?: boolean,
  truncated?: boolean,
  postPage?: boolean,
  voteProps?: VotingProps<VoteableTypeClient>
  className?: string,
}) => {
  const classes = useStyles(styles);

  // Do not truncate for users who have disabled it in their user settings
  const truncationDisabledByUserConfig = useFilteredCurrentUser((u) => u && (postPage ? u.noCollapseCommentsPosts : u.noCollapseCommentsFrontpage));
  const { html = "" } = comment.contents || {}
  const { addedInlinePredictions, inlinePredictionOps } = useAddInlinePredictions();

  const bodyClasses = classNames(
    className,
    !comment.answer && classes.commentStyling,
    comment.answer && classes.answerStyling,
    comment.retracted && classes.retracted,
  );

  if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
  if (collapsed) { return null }

  const innerHtml = (truncated && !truncationDisabledByUserConfig) ? commentExcerptFromHTML(comment, postPage) : (html ?? '')

  let contentType: ContentStyleType;
  if (comment.answer) {
    contentType = 'answer';
  } else if (comment.debateResponse) {
    contentType = 'debateResponse';
  } else {
    contentType = 'comment';
  }
  
  const votingSystem = getVotingSystemByName(comment.votingSystem);
  let highlights: ContentReplacedSubstringComponentInfo[] = [];
  if (voteProps && votingSystem.getCommentHighlights) {
    highlights = votingSystem.getCommentHighlights({comment, voteProps});
  }

  const inlinePredictions = [...comment.inlinePredictions, ...addedInlinePredictions];
  const replacedSubstrings = [...highlights, ...inlinePredictionsToReplacements(inlinePredictions)];

  const contentBody = <ContentStyles contentType={contentType} className={classes.root}>
    <ContentItemBody
      ref={commentBodyRef ?? undefined}
      className={bodyClasses}
      dangerouslySetInnerHTML={{__html: innerHtml }}
      description={`comment ${comment._id}`}
      nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get()}
      replacedSubstrings={replacedSubstrings}
      contentStyleType={contentType}
    />
  </ContentStyles>

  return <SelectedTextToolbarWrapper
    enableCommentOnSelection={false}
    enableInlineReacts={!!votingSystem.hasInlineReacts && !!voteProps}
    enableInlinePredictions={true}
    contentRef={commentBodyRef}
    voteProps={voteProps}
    documentId={comment._id}
    collectionName="Comments"
    styling="comment"
    inlinePredictionOps={inlinePredictionOps}
  >
    {contentBody}
  </SelectedTextToolbarWrapper>
}

export default CommentBody;
