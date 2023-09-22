import { useContext, useCallback } from 'react';
import { useUpdate } from '../../lib/crud/withUpdate';
import { CommentPoolContext } from '../comments/CommentPool';

export type UpdateCommentCallback = (commentId: string, data: NullablePartial<DbComment>)=>Promise<void>;

/**
 * Hook for updating a comment, with extra handling for invalidating entries in
 * a comment-pool using its context.
 */
export function useUpdateComment(fragmentName?: FragmentName): UpdateCommentCallback {
  const commentPoolContext = useContext(CommentPoolContext);
  const { mutate } = useUpdate({
    collectionName: "Comments",
    fragmentName: fragmentName ?? 'CommentsList',
  })

  const mutateAndInvalidate = useCallback(async (commentId: string, data: NullablePartial<DbComment>) => {
    await mutate({
      selector: { documentId: commentId },
      data,
    });
    if (commentPoolContext) {
      await commentPoolContext.invalidateComment(commentId);
    }
  }, [commentPoolContext, mutate]);

  return mutateAndInvalidate;
}
