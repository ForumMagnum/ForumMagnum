import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const rejectPostMutation = gql(`
  mutation rejectPostMutation($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...SunshinePostsList
      }
    }
  }
`);

const rejectCommentMutation = gql(`
  mutation rejectCommentMutation($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

export type RejectContentParams = {
  collectionName: "Posts",
  document: SunshinePostsList
} | {
  collectionName: "Comments",
  document: CommentsList | CommentsListWithParentMetadata
}

export function useRejectContent ({collectionName, document}: RejectContentParams) {
  const [updateContent] = useMutation(collectionName === "Posts" ? rejectPostMutation : rejectCommentMutation);
  
  const rejectContent = useCallback((reason: string) => {
    void updateContent({
      variables: {
        selector: { _id: document._id },
        data: { rejected: true, rejectedReason: reason }
      }
    });
  }, [updateContent, document._id]);
  
  const unrejectContent = useCallback(() => {
    void updateContent({
      variables: {
        selector: { _id: document._id },
        data: { rejected: false }
      }
    });
  }, [updateContent, document._id])
  
  return {rejectContent, unrejectContent} 
}


