import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import type { InboxAction } from './inboxReducer';

const RerunLlmCheckMutation = gql(`
  mutation RerunLlmCheckHook($documentId: String!, $collectionName: ContentCollectionName!) {
    rerunLlmCheck(documentId: $documentId, collectionName: $collectionName) {
      ...AutomatedContentEvaluationsFragment
    }
  }
`);

export function useRerunLlmCheck(
  documentId: string | null,
  collectionName: 'Posts' | 'Comments',
  dispatch: React.Dispatch<InboxAction>
) {
  const { flash } = useMessages();
  const [rerunLlmCheck, { loading }] = useMutation(RerunLlmCheckMutation);

  const handleRerunLlmCheck = useCallback(async () => {
    if (!documentId || loading) return;

    // Set loading state in reducer so all components can see it
    dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId });

    try {
      const result = await rerunLlmCheck({
        variables: { documentId, collectionName },
        update: (cache, { data }) => {
          if (!data?.rerunLlmCheck) return;
          
          // Update the Apollo cache directly
          const typename = collectionName === 'Posts' ? 'Post' : 'Comment';
          cache.modify({
            id: cache.identify({ __typename: typename, _id: documentId }),
            fields: {
              automatedContentEvaluations: () => data.rerunLlmCheck,
            },
          });
        },
      });

      const newAce = result.data?.rerunLlmCheck;
      // For posts, also update the reducer since posts are stored in reducer state
      if (newAce && collectionName === 'Posts') {
        dispatch({
          type: 'UPDATE_POST',
          postId: documentId,
          fields: { automatedContentEvaluations: newAce },
        });
      }

      flash({ messageString: 'LLM check completed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      flash({ messageString: `LLM check failed: ${errorMessage}`, type: 'error' });
    } finally {
      // Clear loading state
      dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: null });
    }
  }, [documentId, collectionName, loading, rerunLlmCheck, dispatch, flash]);

  return {
    handleRerunLlmCheck,
    isRunningLlmCheck: loading,
  };
}

// Drafts are deliberately excluded: the evaluation pipeline scores content on
// publish, and scoring an unpublished draft would just produce a stale result.
function postNeedsLlmRescore(post: SunshinePostsList): boolean {
  return !post.draft && post.automatedContentEvaluations?.pangramScore == null;
}

/**
 * When the moderation user-detail view shows posts that never got an LLM
 * (Pangram) score — because the evaluation failed or was skipped at publish
 * time — automatically rescore them, one at a time, instead of waiting for a
 * moderator to click the manual "LLM" rerun button on each item.
 *
 * Failures are silent (each item is only attempted once per mount) and leave
 * the manual rerun button in place as the fallback.
 */
export function useAutoRescoreMissingLlmScores(
  posts: SunshinePostsList[],
  dispatch: React.Dispatch<InboxAction>
) {
  const [rerunLlmCheck] = useMutation(RerunLlmCheckMutation);
  const attemptedPostIdsRef = useRef<Set<string>>(new Set());
  const isRescoringRef = useRef(false);

  useEffect(() => {
    const postsToRescore = posts.filter(
      (post) => postNeedsLlmRescore(post) && !attemptedPostIdsRef.current.has(post._id)
    );
    if (isRescoringRef.current || !postsToRescore.length) return;

    isRescoringRef.current = true;
    for (const post of postsToRescore) {
      attemptedPostIdsRef.current.add(post._id);
    }

    void (async () => {
      for (const post of postsToRescore) {
        dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: post._id });
        try {
          const result = await rerunLlmCheck({
            variables: { documentId: post._id, collectionName: 'Posts' },
            update: (cache, { data }) => {
              if (!data?.rerunLlmCheck) return;
              cache.modify({
                id: cache.identify({ __typename: 'Post', _id: post._id }),
                fields: {
                  automatedContentEvaluations: () => data.rerunLlmCheck,
                },
              });
            },
          });
          const newAce = result.data?.rerunLlmCheck;
          if (newAce) {
            dispatch({
              type: 'UPDATE_POST',
              postId: post._id,
              fields: { automatedContentEvaluations: newAce },
            });
          }
        } catch {
          // Best-effort: the manual rerun button remains as the fallback
        }
      }
      // Also re-triggers this effect, picking up any posts that appeared mid-run
      dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: null });
      isRescoringRef.current = false;
    })();
  }, [posts, dispatch, rerunLlmCheck]);
}
