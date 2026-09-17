import { useCallback, useMemo, useRef } from 'react';
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
  mutation rejectPostMutation($postId: String!, $rejectedReason: String!, $skipRejectionPM: Boolean) {
    rejectPost(postId: $postId, rejectedReason: $rejectedReason, skipRejectionPM: $skipRejectionPM) {
      ...SunshinePostsList
    }
  }
`);

const unrejectPostMutation = gql(`
  mutation unrejectPostMutation($selector: SelectorInput!, $data: UpdatePostDataInput!) {
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

export type RejectContentWithReason = {
  collectionName: "Posts",
  document: SunshinePostsList
  reason: string
  // Reject without sending the author the usual rejection DM
  skipRejectionPM?: boolean
} | {
  collectionName: "Comments",
  document: CommentsListWithParentMetadata
  reason: string
}

export function useRejectContent() {
  const [rejectPost] = useMutation(rejectPostMutation);
  const [updatePost] = useMutation(unrejectPostMutation);
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

  const queueMutation = useCallback(async (mutationFn: () => Promise<any>) => {
    const currentQueue = mutationQueueRef.current;
    const newMutation = currentQueue
      .then(mutationFn)
      .catch(_ => {});
    mutationQueueRef.current = newMutation;
    return newMutation;
  }, []);
  
  const rejectContent = useCallback((params: RejectContentWithReason) => {
    const { document, reason } = params;
    return queueMutation(async () => {
      if (params.collectionName === "Posts") {
        await rejectPost({
          variables: { postId: document._id, rejectedReason: reason, skipRejectionPM: params.skipRejectionPM ?? false },
          optimisticResponse: { rejectPost: { ...params.document, rejected: true, rejectedReason: reason } },
          onError: () => {},
        });
      } else {
        await updateComment({
          variables: {
            selector: { _id: document._id },
            data: { rejected: true, rejectedReason: reason },
          },
          optimisticResponse: { updateComment: { data: { ...params.document, rejected: true, rejectedReason: reason } } },
          onError: () => {}
        });
      }
    });
  }, [rejectPost, updateComment, queueMutation]);
  
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
          onError: () => {}
        });
      } else {
        await updateComment({
          variables,
          optimisticResponse: { updateComment: { data: { ...document, rejected: false, rejectedReason: null } } },
          onError: () => {}
        });
      }
    });
  }, [updatePost, updateComment, queueMutation]);
  
  return { rejectContent, unrejectContent, rejectionTemplates };
}


