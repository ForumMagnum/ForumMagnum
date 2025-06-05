import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";
import CommentsNodeInner from "./CommentsNode";

const CommentsListQuery = gql(`
  query CommentById($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const CommentById = ({commentId, nestingLevel=0, isChild=false, treeOptions}: {
  commentId: string,
  nestingLevel?: number,
  isChild?: boolean,
  treeOptions: CommentTreeOptions,
}) => {
  const { data } = useQuery(CommentsListQuery, {
    variables: { documentId: commentId },
  });
  const comment = data?.comment?.result;
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


