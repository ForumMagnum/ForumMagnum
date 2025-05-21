import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments, addGapIndicators } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import withErrorBoundary from '../common/withErrorBoundary';
import CommentsNodeInner, { CommentsNodeProps } from './CommentsNode';

const styles = (theme: ThemeType) => ({
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
  initialMaxChildren?: number;
  commentNodeProps?: Partial<CommentsNodeProps>;
  startExpanded?: boolean;
  className?: string;
  classes: ClassesType<typeof styles>;
}

const CommentWithReplies = ({
  comment,
  post,
  lastRead,
  initialMaxChildren = 3,
  commentNodeProps,
  startExpanded,
  className,
  classes,
}: CommentWithRepliesProps) => {
  const [maxChildren, setMaxChildren] = useState(startExpanded ? 500 : initialMaxChildren);

  if (!comment) return null;
  
  const lastCommentId = comment.latestChildren[0]?._id;
  
  const treeOptions: CommentTreeOptions = {
    lastCommentId,
    highlightDate: lastRead,
    condensed: true,
    showPostTitle: true,
    post: post ?? comment.post ?? undefined,
    noDOMId: true,
    ...(commentNodeProps?.treeOptions || {}),
  };
  const renderedChildren = comment.latestChildren.slice(0, maxChildren);
  const extraChildrenCount = Math.max(0, comment.latestChildren.length - renderedChildren.length);

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
    <CommentsNodeInner
      startThreadTruncated={true}
      nestingLevel={1}
      comment={comment}
      childComments={nestedComments}
      key={comment._id}
      shortform
      showExtraChildrenButton={showExtraChildrenButton}
      expandAllThreads={startExpanded}
      forceUnTruncated={startExpanded}
      forceUnCollapsed={startExpanded}
      {...commentNodeProps}
      treeOptions={treeOptions}
      className={className}
    />
  );
};

export default registerComponent(
  'CommentWithReplies', CommentWithReplies, {
    styles,
    hocs: [withErrorBoundary]
  }
);


