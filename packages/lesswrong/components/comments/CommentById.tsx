import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

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
