import { useCallback, useMemo } from 'react';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from '@/lib/crud/useQuery';

const ModerationTemplateFragmentMultiQuery = gql(`
  query multiModerationTemplateRejectContentDialogQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

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

export type RejectContentWithReason = {
  collectionName: "Posts",
  document: SunshinePostsList
  reason: string
} | {
  collectionName: "Comments",
  document: CommentsList | CommentsListWithParentMetadata
  reason: string
}

export function useRejectContent() {
  const [updatePost] = useMutation(rejectPostMutation);
  const [updateComment] = useMutation(rejectCommentMutation);

  const { data } = useQuery(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: "Rejections" } },
      limit: 50,
    },
    ssr: false,
  });

  const rejectionTemplates = useMemo(() => data?.moderationTemplates?.results ?? [], [data]);
  
  const rejectContent = useCallback(({ collectionName, document, reason }: RejectContentWithReason) => {
    if (collectionName === "Posts") {
      void updatePost({
        variables: {
          selector: { _id: document._id },
          data: { rejected: true, rejectedReason: reason }
        }
      });
    } else {
      void updateComment({
        variables: {
          selector: { _id: document._id },
          data: { rejected: true, rejectedReason: reason }
        }
      });
    }
  }, [updatePost, updateComment]);
  
  const unrejectContent = useCallback(({ collectionName, document }: RejectContentParams) => {
    if (collectionName === "Posts") {
      void updatePost({
        variables: {
          selector: { _id: document._id },
          data: { rejected: false }
        }
      });
    } else {
      void updateComment({
        variables: {
          selector: { _id: document._id },
          data: { rejected: false }
        }
      });
    }
  }, [updatePost, updateComment]);
  
  return { rejectContent, unrejectContent, rejectionTemplates };
}


