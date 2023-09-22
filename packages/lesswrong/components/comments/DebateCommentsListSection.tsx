import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { unflattenComments } from '../../lib/utils/unflatten';
import classNames from 'classnames';
import { CommentsNewFormProps } from './CommentsNewForm';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';

export const NEW_COMMENT_MARGIN_BOTTOM = "1.3em"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontWeight: 400,
    margin: "10px auto 5px auto",
    ...theme.typography.commentStyle,
    position: "relative"
  },
  maxWidthRoot: {
    maxWidth: 720,
  },
  inline: {
    display: 'inline',
    color: theme.palette.text.secondary,
  },
  clickToHighlightNewSince: {
    display: 'inline',
    color: theme.palette.text.secondary,
    "@media print": { display: "none" },
  },
  button: {
    color: theme.palette.lwTertiary.main,
  },
  newComment: {
    border: theme.palette.border.commentBorder,
    position: 'relative',
    borderRadius: 3,
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    "@media print": {
      display: "none"
    }
  },
  newCommentLabel: {
    paddingLeft: theme.spacing.unit*1.5,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: 12
  },
  newCommentSublabel: {
    paddingLeft: theme.spacing.unit*1.5,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    marginTop: 4,
  },
  debateCommentsList: {}
})

const DebateCommentsListSection = ({post, totalComments, comments, newForm=true, newFormProps={}, classes}: {
  post: PostsDetails,
  totalComments: number,
  comments: CommentsList[],
  newForm: boolean,
  newFormProps?: Partial<CommentsNewFormProps>,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const commentTree = unflattenComments(comments);
  
  const { CommentThreads, PostsPageCrosspostComments } = Components

  const highlightDate = post?.lastVisitedAt && new Date(post.lastVisitedAt);

  const postAuthor = post.user;

  const userIsDebateParticipant =
    currentUser
    && post?.debate
    && (currentUser._id === postAuthor?._id || post?.coauthorStatuses?.some(coauthor => coauthor.userId === currentUser._id));

  return (
    <div className={classNames(classes.root, classes.maxWidthRoot)}>
      <div id="comments"/>

      {newForm
        && (!currentUser || !post || userIsAllowedToComment(currentUser, post, postAuthor, false))
        && (!post?.draft || userIsDebateParticipant || userIsAdmin(currentUser))
        && (
        <div id={`posts-debate-thread-new-comment`} className={classes.newComment}>
          <div className={classes.newCommentLabel}>New Comment</div>
          <Components.CommentsNewForm
            post={post}
            type="comment"
            {...newFormProps}
          />
        </div>
      )}
      {currentUser && post && !userIsAllowedToComment(currentUser, post, postAuthor, false) &&
        <Components.CantCommentExplanation post={post}/>
      }
      <div className={classes.debateCommentsList}>
        <CommentThreads
          treeOptions={{
            highlightDate: highlightDate,
            post: post,
            postPage: true,
            showCollapseButtons: true,
            hideParentCommentToggle: true,
            forceSingleLine: true
          }}
          totalComments={totalComments}
          comments={commentTree}
        />
      </div>
      <PostsPageCrosspostComments />
    </div>
  );
}

const DebateCommentsListSectionComponent = registerComponent("DebateCommentsListSection", DebateCommentsListSection, {styles});

declare global {
  interface ComponentTypes {
    DebateCommentsListSection: typeof DebateCommentsListSectionComponent,
  }
}

