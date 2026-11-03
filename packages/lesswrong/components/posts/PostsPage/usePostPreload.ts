import { useApolloClient } from '@apollo/client/react';
import { PostsListWithVotes } from '@/lib/collections/posts/fragments';
import { SequencesPageFragment } from '@/lib/collections/sequences/fragments';

/**
 * Check the cache for a copy of the post with the PostsListWithVotes fragment, so that when you click through
 * a PostsItem, you can see the start of the post (the part of the text that was in the hover-preview) while
 * it loads the rest.
 */
export function usePostPreload(documentId: string, sequenceId: string|null) {
  const apolloClient = useApolloClient();
  const postPreload = apolloClient.cache.readFragment<PostsListWithVotes>({
    fragment: PostsListWithVotes,
    fragmentName: "PostsListWithVotes",
    id: 'Post:'+documentId,
  });

  const sequencePreload = apolloClient.cache.readFragment<SequencesPageFragment>({
    fragment: SequencesPageFragment,
    fragmentName: "SequencesPageFragment",
    id: 'Sequence:'+sequenceId,
  });

  return (sequencePreload && postPreload) ? {
    ...postPreload,
    sequence: sequencePreload,
  } : postPreload;
}
