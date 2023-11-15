import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeNode } from "../../lib/utils/unflatten";
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  commentsList: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5,
  },
  noComments: {
    position: "relative",
    textAlign: "right",
    top:-theme.spacing.unit*8
  },
  noCommentAnswersList: {
    borderTop: 'transparent'
  },
  editor: {
    marginLeft: theme.spacing.unit*4,
    marginTop: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    borderTop: `solid 1px ${theme.palette.grey[300]}`
  },
  newComment: {
    padding: theme.spacing.unit*2.5,
    textAlign: 'right',
    color: theme.palette.grey[600]
  },
  loadMore: {
    color: theme.palette.primary.main,
    textAlign: 'right'
  },
})

const AnswerCommentsList = ({classes, post, parentAnswer, commentTree}: {
  classes: ClassesType,
  post: PostsList,
  commentTree: CommentTreeNode<CommentsList>[],
  parentAnswer: CommentsList,
}) => {
  const [commenting, setCommenting] = React.useState(false);
  const [loadedMore, setLoadedMore] = React.useState(false);
  const totalCount = parentAnswer.descendentCount;
  
  const highlightDate =
    (post?.lastVisitedAt
      && new Date(post.lastVisitedAt))
    || new Date();

  const closeCommentNewForm = React.useCallback(
    () => setCommenting(false),
    [setCommenting]
  );

  const { CommentsList, CommentsNewForm, Typography } = Components
  
  return (
    <div>
      {!commenting && <Typography variant="body2" onClick={()=>setCommenting(true)} className={classNames(classes.newComment)}>
          <a>Add Comment</a>
        </Typography>
      }
      {commenting &&
        <div className={classes.editor}>
          <CommentsNewForm
            post={post}
            parentComment={parentAnswer}
            prefilledProps={{
              parentAnswerId: parentAnswer._id,
            }}
            successCallback={closeCommentNewForm}
            cancelCallback={closeCommentNewForm}
            type="reply"
          />
        </div>
      }
      <CommentsList
        treeOptions={{
          postPage: true,
          showCollapseButtons: true,
          post: post,
          highlightDate: highlightDate,
        }}
        totalComments={totalCount}
        comments={commentTree}
        parentCommentId={parentAnswer._id}
        parentAnswerId={parentAnswer._id}
        defaultNestingLevel={2}
        startThreadTruncated
      />
    </div>
  );
}

const AnswerCommentsListComponent = registerComponent('AnswerCommentsList', AnswerCommentsList, {styles});

declare global {
  interface ComponentTypes {
    AnswerCommentsList: typeof AnswerCommentsListComponent
  }
}

