import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeOptions } from './commentTree';
import { useSingle } from '../../lib/crud/withSingle';

const CommentById = ({commentId, treeOptions}: {
  commentId: string,
  treeOptions: CommentTreeOptions,
}) => {
  const {document: comment, loading} = useSingle({
    documentId: commentId,
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  const { CommentsNode } = Components;
  if (!comment) return null;
  return <CommentsNode
    comment={comment}
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
