import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import { useSingle } from '../../lib/crud/withSingle';

const CommentById = ({commentId, nestingLevel=0, isChild=false, treeOptions}: {
  commentId: string,
  nestingLevel?: number,
  isChild?: boolean,
  treeOptions: CommentTreeOptions,
}) => {
  const {document: comment} = useSingle({
    documentId: commentId,
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  const { CommentsNode } = Components;
  if (!comment) return null;
  return <CommentsNode
    comment={comment}
    nestingLevel={nestingLevel}
    isChild={isChild}
    treeOptions={treeOptions}
    loadChildrenSeparately
  />
}

const CommentByIdComponent = registerComponent('CommentById', CommentById);

declare global {
  interface ComponentTypes {
    CommentById: typeof CommentByIdComponent
  }
}
