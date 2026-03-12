import { PostsListWithVotes } from "@/lib/collections/posts/fragments";
import { useApolloClient } from "@apollo/client/react";
import { useEffect } from "react";

export function useHydrateModerationPostCache(posts: SunshinePostsList[]) {
  const apolloClient = useApolloClient();
  useEffect(() => {
    for (const post of posts) {
      const cacheEntryIdentifiers = {
        fragment: PostsListWithVotes,
        fragmentName: "PostsListWithVotes",
        id: 'Post:'+post._id,
      };
      
      const existingCacheEntry = apolloClient.cache.readFragment<PostsListWithVotes>(cacheEntryIdentifiers);

      if (existingCacheEntry) {
        continue;
      }

      apolloClient.cache.writeFragment<PostsListWithVotes>({
        ...cacheEntryIdentifiers,
        data: {
          ...post,
          bannedUserIds: null,
          contents: {
            ...post.contents,
            _id: post.contents?._id ?? '',
            plaintextDescription: '',
            htmlHighlight: post.contents?.htmlHighlight ?? '',
            wordCount: post.contents?.wordCount ?? 0,
            version: post.contents?.version ?? '',
          },
          podcastEpisode: null,
        },
        broadcast: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);
}
