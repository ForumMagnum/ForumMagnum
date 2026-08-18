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

// Drafts are excluded: rerunLlmCheck follows contents_latest blindly, so it would
// score an in-progress autosave that the publish-time pipeline deliberately skips.
// Rejected posts are included: templateHighlightRules reads their scores too.
function postNeedsLlmRescore(post: SunshinePostsList): boolean {
  return !post.draft && post.automatedContentEvaluations?.pangramScore == null;
}

function findNextPostToRescore(posts: SunshinePostsList[], attemptedPostIds: Set<string>): SunshinePostsList | undefined {
  return posts.find((post) => postNeedsLlmRescore(post) && !attemptedPostIds.has(post._id));
}

/**
 * Backfills missing Pangram scores for posts shown in the user detail view, via
 * the same mutation as the manual "LLM" button (which records scores, never
 * autorejects). Sequential, to pace spend on the paid Pangram API: each post is
 * attempted at most once per mount (the view fetches ~20 posts per viewed user),
 * with the manual button as the fallback. Not coordinated with the manual button
 * — a concurrent manual rerun just wastes one duplicate check.
 */
export function useAutoRescoreMissingLlmScores(
  posts: SunshinePostsList[],
  dispatch: React.Dispatch<InboxAction>
) {
  const [rerunLlmCheck] = useMutation(RerunLlmCheckMutation);
  const attemptedPostIdsRef = useRef<Set<string>>(new Set());
  const isRescoringRef = useRef(false);
  // The drain loop reads the latest posts, so ones arriving mid-run (e.g. after a
  // user switch) aren't dropped; effect re-runs during a drain bail on the latch
  const latestPostsRef = useRef(posts);
  // Unmount-only cancellation: the work effect re-runs whenever posts change, so
  // it deliberately has no cleanup; re-setting false covers StrictMode remounts
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      // Free the shared spinner slot; a successor view's effects run after this
      dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: null });
    };
  }, [dispatch]);

  useEffect(() => {
    latestPostsRef.current = posts;
    if (isRescoringRef.current || !findNextPostToRescore(posts, attemptedPostIdsRef.current)) {
      return;
    }
    isRescoringRef.current = true;

    void (async () => {
      try {
        while (!unmountedRef.current) {
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
              // This view's list updates via the cache write above; the inbox tabs
              // render reducer-owned copies of posts, so sync those too
              dispatch({
                type: 'UPDATE_POST',
                postId,
                fields: { automatedContentEvaluations: newAce },
              });
            }
          } catch {
            // Silent: a background backfill shouldn't toast per failure
          }
        }
      } finally {
        isRescoringRef.current = false;
        // After unmount the cleanup above already freed the shared spinner slot
        if (!unmountedRef.current) {
          dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: null });
        }
      }
    })();
  }, [posts, dispatch, rerunLlmCheck]);
}
