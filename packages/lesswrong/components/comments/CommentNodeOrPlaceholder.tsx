import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeOptions } from './commentTree';
import type { CommentTreeNode } from '../../lib/utils/unflatten';

const CommentNodeOrPlaceholder = ({treeOptions, treeNode, startThreadTruncated, truncated, expandAllThreads, nestingLevel=1, parentCommentId, parentAnswerId, shortform, isChild, className}: {
  treeOptions: CommentTreeOptions,
  treeNode: CommentTreeNode<CommentsList>,
  
  startThreadTruncated?: boolean,
  truncated?: boolean,
  expandAllThreads?: boolean,
  nestingLevel?: number,
  parentAnswerId?: string|null,
  parentCommentId?: string,
  shortform?: boolean,
  isChild?: boolean,
  className?: string,
}) => {
  const { CommentsNode, CommentPlaceholder } = Components;

  if (treeNode.item) {
    return <CommentsNode
      treeOptions={treeOptions}
      comment={treeNode.item}
      childComments={treeNode.children}
      key={treeNode._id}
      startThreadTruncated={startThreadTruncated}
      truncated={truncated}
      expandAllThreads={expandAllThreads}
      nestingLevel={nestingLevel}
      parentAnswerId={parentAnswerId}
      parentCommentId={parentCommentId}
      shortform={shortform}
      isChild={isChild}
      className={className}
    />
  } else {
    return <CommentPlaceholder
      key={treeNode._id}
      treeOptions={treeOptions}
      treeNode={treeNode}
      nestingLevel={nestingLevel}
      isChild={isChild}
    />
  }
}

const CommentNodeOrPlaceholderComponent = registerComponent('CommentNodeOrPlaceholder', CommentNodeOrPlaceholder);

declare global {
  interface ComponentTypes {
    CommentNodeOrPlaceholder: typeof CommentNodeOrPlaceholderComponent
  }
}

