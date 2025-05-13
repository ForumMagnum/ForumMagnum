import React, { useMemo, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeNode } from "../../lib/utils/unflatten";
import classNames from 'classnames';
import type { CommentTreeOptions } from '../comments/commentTree';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import CommentsList from "../comments/CommentsList";

const styles = (theme: ThemeType) => ({
  commentsList: {
    marginLeft: -4,
    marginRight: -12,
    marginBottom: 16,
    marginTop: 8,
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

const AnswerCommentsList = ({post, parentAnswer, commentTree, treeOptions, classes}: {
  post: PostsList,
  commentTree: CommentTreeNode<CommentsList>[],
  treeOptions: CommentTreeOptions,
  parentAnswer: CommentsList,
  classes: ClassesType<typeof styles>,
}) => {
  const totalCount = parentAnswer.descendentCount;
  const now = useCurrentTime();
  const treeOptionsWithHighlight = useMemo(() => ({
    ...treeOptions,
    highlightDate: post?.lastVisitedAt ? new Date(post.lastVisitedAt) : now,
  }), [treeOptions, post?.lastVisitedAt, now]);
  
  return <div className={classes.commentsList}>
    <CommentsList
      treeOptions={treeOptionsWithHighlight}
      totalComments={totalCount}
      comments={commentTree}
      parentCommentId={parentAnswer._id}
      parentAnswerId={parentAnswer._id}
      defaultNestingLevel={1}
      startThreadTruncated
    />
  </div>
}

export default registerComponent('AnswerCommentsList', AnswerCommentsList, {styles});



