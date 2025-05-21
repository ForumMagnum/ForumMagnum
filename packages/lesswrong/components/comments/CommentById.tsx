import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import { useSingle } from '../../lib/crud/withSingle';
import CommentsNodeInner from "./CommentsNode";

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
  if (!comment) return null;
  return <CommentsNodeInner
    comment={comment}
    nestingLevel={nestingLevel}
    isChild={isChild}
    treeOptions={treeOptions}
    loadChildrenSeparately
  />
}

export default registerComponent('CommentById', CommentById);


