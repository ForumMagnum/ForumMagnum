import classNames from 'classnames';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    padding: 8,
    borderLeft: 'solid',
    borderLeftWidth: '1.5px',
    '&:hover $menu': {
      opacity: 0.2
    },
    ...theme.typography.commentStyle,
  },
  blockMargin: {
    marginBottom: 16
  },
  commentWithReplyButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
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
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: theme.palette.border.normal,
    height: 0,
    position: 'relative',
    marginBottom: '16px'
  },
  dividerLabel: {
    width: 'fit-content',
    paddingLeft: 6,
    paddingRight: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    ...theme.typography.subheading
  },
  greenBorder: {
    borderColor: theme.palette.border.debateComment
  },
  redBorder: {
    borderColor: theme.palette.border.debateComment2
  },
  blueBorder: {
    borderColor: theme.palette.border.debateComment3
  },
  purpleBorder: {
    borderColor: theme.palette.border.debateComment4
  },
  blackBorder: {
    borderColor: theme.palette.border.debateComment5
  },
});

export interface DebateCommentWithReplies {
  comment: CommentsList;
  replies: CommentsList[];
}

const getParticipantBorderStyle = (participantIndex: number) => {
  switch (participantIndex) {
    case 0:
      return 'greenBorder';
    case 1:
      return 'redBorder';
    case 2:
      return 'blueBorder';
    case 3:
      return 'purpleBorder';
    default:
      return 'blackBorder';
  }
};

export const DebateCommentBlock = ({ comments, post, orderedParticipantList, daySeparator, classes }: {
  comments: DebateCommentWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  orderedParticipantList: string[],
  daySeparator?: string,
  classes: ClassesType,
}) => {
  const { CommentUserName, CommentsItemDate, CommentBody, CommentsEditForm, CommentsMenu, DebateCommentsListSection, Loading, ContentStyles } = Components;

  const [showReplyState, setShowReplyState] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const showRepliesForComment = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowReplyState(!showReplyState);
  };

  return <div>
    {daySeparator && <div className={classes.divider}>
      <span className={classes.dividerLabel}>{daySeparator}</span>
    </div>}
    {comments.map(({ comment, replies }, idx) => {
      const showHeader = idx === 0;
      const showReplyLink = replies.length > 0 || idx === (comments.length - 1);
      const addBottomMargin = idx === (comments.length - 1);
      const participantIndex = orderedParticipantList.indexOf(comment.userId);
      const borderStyle = getParticipantBorderStyle(participantIndex);

      const header = showHeader && <>
        <CommentUserName comment={comment} className={classes.username} />
        <CommentsItemDate comment={comment} post={post} />
      </>;

      const menu = <CommentsMenu
        comment={comment}
        post={post}
        showEdit={() => setShowEdit(true)}
        className={classes.menu}
      />;

      const commentBodyOrEditor = showEdit
      ? <CommentsEditForm
          comment={comment}
          successCallback={() => setShowEdit(false)}
          cancelCallback={() => setShowEdit(false)}
          className={classes.editForm}
        />
      : <CommentBody comment={comment} />;

      const replyLink = showReplyLink && <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={e => showRepliesForComment(e)}>
        Reply <span>({replies.filter(replyComment => replyComment.topLevelCommentId === comment._id).length})</span>
      </a>;

      const replyCommentList =
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
        />;

      const replyState = showReplyState && replyCommentList;

      return (
        <div
          id={`debate-comment-${comment._id}`}
          className={classNames(classes.innerDebateComment, classes[borderStyle], { [classes.blockMargin]: addBottomMargin })}
        >
          {header}
          {menu}
          <div className={classes.commentWithReplyButton}>
            {commentBodyOrEditor}
            {replyLink}
          </div>
          {replyState}
        </div>
      );
    })}
  </div>;
}

const DebateCommentBlockComponent = registerComponent('DebateCommentBlock', DebateCommentBlock, {styles, stylePriority: 200});

declare global {
  interface ComponentTypes {
    DebateCommentBlock: typeof DebateCommentBlockComponent
  }
}

