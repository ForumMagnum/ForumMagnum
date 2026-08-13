import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';

const RejectContentAndRemoveFromQueueMutation = gql(`
  mutation rejectContentAndRemoveFromQueueSupermod($userId: String!, $documentId: String!, $collectionName: ContentCollectionName!, $rejectedReason: String!, $restrictUser: Boolean) {
    rejectContentAndRemoveUserFromQueue(userId: $userId, documentId: $documentId, collectionName: $collectionName, rejectedReason: $rejectedReason, restrictUser: $restrictUser)
  }
`);

export interface RejectAndRemoveFromQueueArgs {
  userId: string;
  documentId: string;
  collectionName: 'Posts' | 'Comments';
  rejectedReason: string;
  /** Also disables the user's posting, commenting, messaging and voting */
  restrictUser?: boolean;
}

/**
 * Rejects one post or comment and takes its author out of the review queue
 * (without approving them), optionally restricting the author's permissions too.
 */
export function useRejectContentAndRemoveFromQueue() {
  const [rejectContentAndRemoveFromQueueMutation] = useMutation(RejectContentAndRemoveFromQueueMutation);

  return useCallback(async (variables: RejectAndRemoveFromQueueArgs) => {
    await rejectContentAndRemoveFromQueueMutation({ variables });
  }, [rejectContentAndRemoveFromQueueMutation]);
}
