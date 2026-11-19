import { useCallback, useMemo, useRef } from 'react';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from '@/lib/crud/useQuery';
import { useMessages } from '@/components/common/withMessages';

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
  document: CommentsListWithParentMetadata
}

export interface RejectContentWithReason {
  collectionName: "Posts" | "Comments";
  document: { _id: string };
  reason: string;
}

export function useRejectContent() {
  const { flash } = useMessages();
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
  
  // Mutation queue to ensure sequential execution and prevent race conditions from sending the opposite-direction action before the previous one has finished
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const queueMutation = useCallback((mutationFn: () => Promise<void>) => {
    const result = mutationQueueRef.current.then(mutationFn).then(() => true, (error: unknown) => {
      flash({ messageString: error instanceof Error ? error.message : String(error), type: "error" });
      return false;
    });
    mutationQueueRef.current = result.then(() => {});
    return result;
  }, [flash]);

  const rejectContent = useCallback(({ collectionName, document, reason }: RejectContentWithReason) => {
    return queueMutation(async () => {
      const variables = {
        selector: { _id: document._id },
        data: { rejected: true, rejectedReason: reason }
      };

      if (collectionName === "Posts") {
        await updatePost({
          variables,
        });
      } else {
        await updateComment({
          variables,
        });
      }
    });
  }, [updatePost, updateComment, queueMutation]);
  
  const unrejectContent = useCallback(({ collectionName, document }: RejectContentParams) => {
    return queueMutation(async () => {
      const variables = {
        selector: { _id: document._id },
        data: { rejected: false, rejectedReason: null }
      };

      if (collectionName === "Posts") {
        await updatePost({
          variables,
          optimisticResponse: { updatePost: { data: { ...document, rejected: false, rejectedReason: null } } },
        });
      } else {
        await updateComment({
          variables,
          optimisticResponse: { updateComment: { data: { ...document, rejected: false, rejectedReason: null } } },
        });
      }
    });
  }, [updatePost, updateComment, queueMutation]);
  
  return { rejectContent, unrejectContent, rejectionTemplates };
}


