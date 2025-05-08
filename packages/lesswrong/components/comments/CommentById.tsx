import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import { useSingle } from '../../lib/crud/withSingle';
import { CommentsNode } from "./CommentsNode";

const CommentByIdInner = ({commentId, nestingLevel=0, isChild=false, treeOptions}: {
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
  if (!comment) return null;
  return <CommentsNode
    comment={comment}
    nestingLevel={nestingLevel}
    isChild={isChild}
    treeOptions={treeOptions}
    loadChildrenSeparately
  />
}

export const CommentById = registerComponent('CommentById', CommentByIdInner);

declare global {
  interface ComponentTypes {
    CommentById: typeof CommentById
  }
}
