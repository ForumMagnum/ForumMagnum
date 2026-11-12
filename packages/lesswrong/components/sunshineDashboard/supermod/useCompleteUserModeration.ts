import { useCallback, useRef } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { randomId } from '@/lib/random';
import type { InboxAction } from './inboxReducer';

const CompleteUserModerationMutation = gql(`
  mutation CompleteUserModeration($input: CompleteUserModerationInput!) {
    completeUserModeration(input: $input) {
      user { ...SunshineUsersList }
      rejectedPosts { ...SunshinePostsList }
      rejectedComments { ...SunshineCommentsList }
      message { ...messageListFragment }
    }
  }
`);

/** One mutation owns completion; a retry of the same submission reuses its creation IDs. */
export function useCompleteUserModeration(dispatch: React.ActionDispatch<[action: InboxAction]>) {
  const [complete] = useMutation(CompleteUserModerationMutation);
  const client = useApolloClient();
  const submission = useRef<{ key: string, operationId: string } | null>(null);
  const running = useRef(false);
  return useCallback(async (input: Omit<CompleteUserModerationInput, 'operationId'>) => {
    if (running.current) throw new Error('This moderation action is already running');
    const key = JSON.stringify(input);
    if (submission.current?.key !== key) submission.current = { key, operationId: randomId() };
    running.current = true;
    try {
      const { data } = await complete({ variables: { input: { ...input, operationId: submission.current.operationId } } });
      if (!data?.completeUserModeration) throw new Error('Moderation action returned no result');
      const result = data.completeUserModeration;
      dispatch({ type: 'UPDATE_USER', userId: input.userId, fields: result.user });
      // A previous attempt may have rejected other items before failing. Refresh their
      // cached query too, rather than assuming this response contains every old write.
      await client.refetchQueries({ include: ['multiCommentModerationSidebarQuery', 'multiPostusePublishedPostsQuery', 'multiConversationModerationActivityFeedQuery'] });
      if (input.removeFromQueue) dispatch({ type: 'REMOVE_USER', userId: input.userId });
      submission.current = null;
      return result;
    } finally {
      running.current = false;
    }
  }, [complete, client, dispatch]);
}
