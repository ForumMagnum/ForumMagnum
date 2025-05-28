import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

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
  content: SunshinePostsList
} | {
  collectionName: "Comments",
  content: CommentsList | CommentsListWithParentMetadata
}

export function useRejectContent ({collectionName, content}: RejectContentParams) {
  // const fragmentName = collectionName === "Posts" ? "SunshinePostsList" : "CommentsListWithParentMetadata"
  // const { mutate: updateContent } = useUpdate({
  //   collectionName,
  //   fragmentName
  // });

  const [updateContent] = useMutation(collectionName === "Posts" ? rejectPostMutation : rejectCommentMutation);
  
  const rejectContent = useCallback((reason: string) => {
    void updateContent({
      variables: {
        selector: { _id: content._id },
        data: { rejected: true, rejectedReason: reason }
      }
    });
  }, [updateContent, content._id]);
  
  const unrejectContent = useCallback(() => {
    void updateContent({
      variables: {
        selector: { _id: content._id },
        data: { rejected: false }
      }
    });
  }, [updateContent, content._id])
  
  return {rejectContent, unrejectContent} 
}


