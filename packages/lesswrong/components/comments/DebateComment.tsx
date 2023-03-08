import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useHover } from '../common/withHover';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    marginBottom: 16,
    padding: 8,
    // borderRadius: 8,
    borderLeft: 'solid',
    borderLeftWidth: '1.5px',
    borderColor: theme.palette.primary.dark,
    '&:hover $menu': {
      opacity: 0.2
    },
    ...theme.typography.commentStyle,
  },
  commentWithReplyButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    // fontSize: '1.3rem'
  },
  username: {
    marginRight: 10,
    fontSize: '1.35rem'
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
  },
  menu: {
    opacity: 0,
    marginRight: '-30px',
    float: 'right'
  },
  editForm: {
    width: '100%'
  }
  // hideMenu: {
  //   visibility: 'hidden'
  // }
});

export const DebateComment = ({ comment, replies, loadingReplies, post, toggleDebateCommentReplyForm, blockPosition, classes }: {
  comment: CommentsList,
  replies: CommentsList[],
  loadingReplies: boolean,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  toggleDebateCommentReplyForm: (parentComment: CommentsList, action: 'open' | 'close') => void,
  blockPosition: 'first' | 'middle' | 'last',
  classes: ClassesType,
}) => {
  const { CommentUserName, CommentsItemDate, CommentBody, CommentsEditForm, CommentsMenu, DebateCommentsListSection, Loading, ContentStyles } = Components;

  const [showReplyState, setShowReplyState] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

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
    {<>
      <CommentUserName comment={comment} className={classes.username} />
      <CommentsItemDate comment={comment} post={post} />
    </>}
    <CommentsMenu
      comment={comment}
      post={post}
      showEdit={() => setShowEdit(true)}
      className={classes.menu}
    />
    <div className={classes.commentWithReplyButton}>
      {/* <ContentStyles contentType="comment"> */}
      {showEdit ? <CommentsEditForm
        comment={comment}
        successCallback={() => setShowEdit(false)}
        cancelCallback={() => setShowEdit(false)}
        className={classes.editForm}
      /> : <CommentBody comment={comment} />}
      {/* </ContentStyles> */}
      {<a className={classNames("comments-item-reply-link", classes.replyLink/*, { [classes.hideReplyLink]: !hover }*/)} onClick={e => showRepliesForComment(e)}>
        Reply <span>({replies.filter(replyComment => replyComment.topLevelCommentId === comment._id).length})</span>
      </a>}
    </div>
    {showReplyState && (!loadingReplies
      ? replyCommentList
      : <Loading />)}
  </div>;
}

const DebateCommentComponent = registerComponent('DebateComment', DebateComment, {styles, stylePriority: 200});

declare global {
  interface ComponentTypes {
    DebateComment: typeof DebateCommentComponent
  }
}

