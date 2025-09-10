import React from 'react';
import type { CommentTreeOptions } from './commentTree';
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import CommentsNode from "./CommentsNode";
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import Loading from '../vulcan-core/Loading';

const CommentsListQuery = gql(`
  query CommentById($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

type CommentByIdProps = {
  commentId: string,
  nestingLevel?: number,
  isChild?: boolean,
  treeOptions: CommentTreeOptions,
  loadChildren: boolean,
};

/**
 * Load and display a comment by ID. While loading, suspends; if you use this
 * version of the component you probably want to provide a suspense boundary
 * for it.
 */
export const CommentByIdSuspense = ({commentId, nestingLevel=0, isChild=false, treeOptions, loadChildren}: CommentByIdProps) => {
  const { data } = useSuspenseQuery(CommentsListQuery, {
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

/**
 * Load and display a comment by ID. While loading, displays a loading spinner
 * (ie, contains its own suspense boundary).
 */
export const CommentById = (props: CommentByIdProps) => {
  return <SuspenseWrapper name="CommentById" fallback={<Loading/>}>
    <CommentByIdSuspense {...props}/>
  </SuspenseWrapper>
}

