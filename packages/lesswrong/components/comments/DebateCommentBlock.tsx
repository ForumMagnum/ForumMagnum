import classNames from 'classnames';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    padding: 8,
    borderLeft: 'solid',
    borderLeftWidth: '1.5px',
    borderColor: theme.palette.primary.dark,
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
    marginTop: -1,
    width: 'fit-content',
    paddingLeft: 6,
    paddingRight: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    ...theme.typography.subheading
  }
});

export interface DebateCommentWithReplies {
  comment: CommentsList;
  replies: CommentsList[];
}

export const DebateCommentBlock = ({ comments, loadingReplies, post, toggleDebateCommentReplyForm, daySeparator, classes }: {
  comments: DebateCommentWithReplies[],
  loadingReplies: boolean,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  toggleDebateCommentReplyForm: (parentComment: CommentsList, action: 'open' | 'close') => void,
  daySeparator?: string,
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

  return <div>
    {daySeparator && <div className={classes.divider}>
      <span className={classes.dividerLabel}>{daySeparator}</span>
    </div>}
    {comments.map(({ comment, replies }, idx) => {
      const showHeader = idx === 0;
      const showReplyLink = replies.length > 0 || idx === (comments.length - 1);
      const addBottomMargin = idx === (comments.length - 1);

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

      const replyLink = showReplyLink && <a className={classNames("comments-item-reply-link", classes.replyLink/*, { [classes.hideReplyLink]: !hover }*/)} onClick={e => showRepliesForComment(e)}>
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

      const replyState = showReplyState && (!loadingReplies
        ? replyCommentList
        : <Loading />);

      return (
        <div
          key={`debate-comment-${comment._id}`}
          className={classNames(classes.innerDebateComment, { [classes.blockMargin]: addBottomMargin })}
          {...eventHandlers}
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

