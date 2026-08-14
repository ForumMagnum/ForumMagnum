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

// Drafts get scored when published; scoring one now could capture a stale autosave.
// Rejected posts are included: highlight rules read scores on rejected content too.
function postNeedsLlmRescore(post: SunshinePostsList): boolean {
  return !post.draft && post.automatedContentEvaluations?.pangramScore == null;
}

function findNextPostToRescore(posts: SunshinePostsList[], attemptedPostIds: Set<string>): SunshinePostsList | undefined {
  return posts.find((post) => postNeedsLlmRescore(post) && !attemptedPostIds.has(post._id));
}

/**
 * Backfills missing Pangram scores for posts shown in the user detail view, via
 * the same mutation as the manual "LLM" button (which records scores, never
 * autorejects). Sequential, to avoid bursts against the paid Pangram API. Each
 * post is attempted once per mount; the manual button remains the fallback.
 */
export function useAutoRescoreMissingLlmScores(
  posts: SunshinePostsList[],
  dispatch: React.Dispatch<InboxAction>
) {
  const [rerunLlmCheck] = useMutation(RerunLlmCheckMutation);
  const attemptedPostIdsRef = useRef<Set<string>>(new Set());
  const isRescoringRef = useRef(false);
  // The drain loop reads the latest posts, so ones arriving mid-run (e.g. after a
  // user switch) aren't dropped — the effect can't re-fire while the loop is going
  const latestPostsRef = useRef(posts);
  latestPostsRef.current = posts;

  useEffect(() => {
    if (isRescoringRef.current || !findNextPostToRescore(posts, attemptedPostIdsRef.current)) {
      return;
    }
    isRescoringRef.current = true;

    void (async () => {
      for (;;) {
        const post = findNextPostToRescore(latestPostsRef.current, attemptedPostIdsRef.current);
        if (!post) break;
        const postId = post._id;
        attemptedPostIdsRef.current.add(postId);
        dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: postId });
        try {
          const result = await rerunLlmCheck({
            variables: { documentId: postId, collectionName: 'Posts' },
            update: (cache, { data }) => {
              if (!data?.rerunLlmCheck) return;
              cache.modify({
                id: cache.identify({ __typename: 'Post', _id: postId }),
                fields: {
                  automatedContentEvaluations: () => data.rerunLlmCheck,
                },
              });
            },
          });
          const newAce = result.data?.rerunLlmCheck;
          if (newAce) {
            // The inbox tabs render reducer-owned copies of posts; keep those in sync
            dispatch({
              type: 'UPDATE_POST',
              postId,
              fields: { automatedContentEvaluations: newAce },
            });
          }
        } catch {
          // Silent: no toast spam from a background backfill; manual button remains
        }
      }
      dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: null });
      isRescoringRef.current = false;
    })();
  }, [posts, dispatch, rerunLlmCheck]);
}
