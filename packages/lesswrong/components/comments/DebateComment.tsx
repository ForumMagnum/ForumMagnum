import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useHover } from '../common/withHover';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    borderStyle: 'solid',
    borderColor: theme.palette.primary.dark
  },
  commentWithReplyButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
  },
  username: {
    marginRight: 10
  },
  replyLink: {
    color: theme.palette.link.dim,
    "@media print": {
      display: "none",
    },
    minWidth: 'fit-content'
  },
  hideReplyLink: {
    visibility: 'hidden'
  }
});

export const DebateComment = ({ comment, replies, loadingReplies, post, toggleDebateCommentReplyForm, classes }: {
  comment: CommentsList,
  replies: CommentsList[],
  loadingReplies: boolean,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  toggleDebateCommentReplyForm: (parentComment: CommentsList, action: 'open' | 'close') => void,
  classes: ClassesType,
}) => {
  const { CommentUserName, CommentsItemDate, CommentBody, DebateCommentsListSection, Loading } = Components;

  const [showReplyState, setShowReplyState] = useState(false);

  const { everHovered, hover, eventHandlers } = useHover();

  const showRepliesForComment = (e: React.MouseEvent) => {
    e.preventDefault();

    const toggle = showReplyState ? 'close' : 'open';
    // toggleDebateCommentReplyForm(comment, toggle);

    setShowReplyState(!showReplyState);
  };

  const replyCommentList = (
    <DebateCommentsListSection
      comments={replies}
      totalComments={replies.length}
      post={post}
      newForm={true}
      newFormProps={{
        parentComment: comment,
        removeFields: ['debateComment'],
        replyFormStyle: 'minimalist'
      }}
    />
  );

  return <div key={`debate-comment-${comment._id}`} className={classes.innerDebateComment} {...eventHandlers}>
    <CommentUserName comment={comment} className={classes.username} />
    <CommentsItemDate comment={comment} post={post} />
    <div className={classes.commentWithReplyButton}>
      <CommentBody comment={comment} />
      {<a className={classNames("comments-item-reply-link", classes.replyLink/*, { [classes.hideReplyLink]: !hover }*/)} onClick={e => showRepliesForComment(e)}>
        Reply <span>({replies.filter(replyComment => replyComment.topLevelCommentId === comment._id).length})</span>
      </a>}
    </div>
    {showReplyState && (!loadingReplies
      ? replyCommentList
      : <Loading />)}
  </div>;
}

const DebateCommentComponent = registerComponent('DebateComment', DebateComment, {styles});

declare global {
  interface ComponentTypes {
    DebateComment: typeof DebateCommentComponent
  }
}

