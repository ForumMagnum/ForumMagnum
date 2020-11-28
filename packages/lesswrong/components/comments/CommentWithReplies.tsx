import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments, addGapIndicators } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import { useRecordPostView } from '../common/withRecordPostView';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = (theme: ThemeType): JssStyles => ({
  showChildren: {
    padding: 4,
    paddingLeft: 12,
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    display: "block",
    fontSize: 14,
  },
})

const CommentWithReplies = ({comment, post, refetch, showTitle=true, expandByDefault, classes}: {
  comment: CommentWithRepliesFragment,
  post: PostsBase,
  refetch: any,
  showTitle?: boolean,
  expandByDefault?: boolean,
  classes: ClassesType,
}) => {
  const [markedAsVisitedAt,setMarkedAsVisitedAt] = useState<Date|null>(null);
  const [maxChildren,setMaxChildren] = useState(3);
  const { recordPostView } = useRecordPostView(post);

  const markAsRead = useCallback(async () => {
    setMarkedAsVisitedAt(new Date());
    recordPostView({post})
  }, [setMarkedAsVisitedAt, recordPostView, post]);

  const { CommentsNode } = Components

  if (!comment || !post)
    return null;

  const lastCommentId = comment.latestChildren[0]?._id

  const renderedChildren = comment.latestChildren.slice(0, maxChildren)
  const extraChildrenCount = (comment.latestChildren.length > renderedChildren.length) && (comment.latestChildren.length - renderedChildren.length)

  let nestedComments = unflattenComments(renderedChildren)
  if (extraChildrenCount > 0) {
    nestedComments = addGapIndicators(nestedComments)
  }

  const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

  const showExtraChildrenButton = (extraChildrenCount>0) ? 
    <a className={classes.showChildren} onClick={()=>setMaxChildren(500)}>
      Showing 3 of {comment.latestChildren.length } replies (Click to show all)
    </a> : null

  const treeOptions: CommentTreeOptions = {
    lastCommentId,
    markAsRead: markAsRead,
    highlightDate: lastVisitedAt,
    condensed: true,
    showPostTitle: showTitle,
    refetch,
    post,
  };
  
  return <CommentsNode
    treeOptions={treeOptions}
    noHash
    startThreadTruncated={true}
    nestingLevel={1}
    comment={comment}
    childComments={nestedComments}
    key={comment._id}
    shortform
    expandByDefault={expandByDefault}
    showExtraChildrenButton={showExtraChildrenButton}
  />
}

const CommentWithRepliesComponent = registerComponent(
  'CommentWithReplies', CommentWithReplies, {
    styles,
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    CommentWithReplies: typeof CommentWithRepliesComponent,
  }
}

