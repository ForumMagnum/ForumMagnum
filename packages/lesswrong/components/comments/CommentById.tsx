import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import CommentsNode from "./CommentsNode";

const CommentsListQuery = gql(`
  query CommentById($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const CommentById = ({commentId, nestingLevel=0, isChild=false, treeOptions, loadChildren}: {
  commentId: string,
  nestingLevel?: number,
  isChild?: boolean,
  treeOptions: CommentTreeOptions,
  loadChildren: boolean,
}) => {
  const { data } = useQuery(CommentsListQuery, {
    variables: { documentId: commentId },
  });
  const comment = data?.comment?.result;
  if (!comment) return null;
  
  return <CommentsNode
    comment={comment}
    nestingLevel={nestingLevel}
    isChild={isChild}
    treeOptions={treeOptions}
    loadChildrenSeparately={loadChildren}
  />
}

export default registerComponent('CommentById', CommentById);


