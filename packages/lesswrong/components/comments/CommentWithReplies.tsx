import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments, addGapIndicators } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import withErrorBoundary from '../common/withErrorBoundary';
import { CommentsNodeProps } from './CommentsNode';
import { useLocation } from '../../lib/routeUtil';

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

export interface CommentWithRepliesProps {
  comment: CommentWithRepliesFragment;
  post?: PostsBase;
  lastRead?: Date;
  markAsRead?: any;
  initialMaxChildren?: number;
  commentNodeProps?: Partial<CommentsNodeProps>;
  classes: ClassesType;
}

const CommentWithReplies = ({
  comment,
  post,
  lastRead,
  markAsRead = () => {},
  initialMaxChildren = 3,
  commentNodeProps,
  classes,
}: CommentWithRepliesProps) => {
  const { hash: focusCommentId } = useLocation();

  const commentId = focusCommentId.slice(1) || null;
  const startExpanded = comment.latestChildren.some(c => c._id === commentId)
  
  const [maxChildren, setMaxChildren] = useState(startExpanded ? 500 : initialMaxChildren);

  if (!comment) return null;
  
  const lastCommentId = comment.latestChildren[0]?._id;
  
  const treeOptions: CommentTreeOptions = {
    lastCommentId,
    markAsRead: markAsRead,
    highlightDate: lastRead,
    condensed: true,
    showPostTitle: true,
    post,
    ...(commentNodeProps?.treeOptions || {}),
  };

  const { CommentsNode } = Components;

  const renderedChildren = comment.latestChildren.slice(0, maxChildren);
  const extraChildrenCount =
    comment.latestChildren.length > renderedChildren.length && comment.latestChildren.length - renderedChildren.length;

  let nestedComments = unflattenComments(renderedChildren);
  if (extraChildrenCount > 0) {
    nestedComments = addGapIndicators(nestedComments);
  }

  const showExtraChildrenButton =
    extraChildrenCount > 0 ? (
      <a className={classes.showChildren} onClick={() => setMaxChildren(maxChildren + 500)}>
        Showing {maxChildren} of {comment.latestChildren.length} replies (Click to show all)
      </a>
    ) : null;

  return (
    <CommentsNode
      noHash
      startThreadTruncated={true}
      nestingLevel={1}
      comment={comment}
      childComments={nestedComments}
      key={comment._id}
      shortform
      showExtraChildrenButton={showExtraChildrenButton}
      {...commentNodeProps}
      treeOptions={treeOptions}
      expandAllThreads={startExpanded}
      expandByDefault={startExpanded}
    />
  );
};

const CommentWithRepliesComponent = registerComponent(
  'CommentWithReplies', CommentWithReplies, {
    styles,
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    CommentWithReplies: typeof CommentWithRepliesComponent;
  }
}

