import { useQuery } from "@/lib/crud/useQuery";
import { usePublishedPosts } from "./usePublishedPosts";
import { gql } from "@/lib/generated/gql-codegen";
import { useEffect, useMemo } from "react";
import { useApolloClient } from "@apollo/client/react";
import { PostsListWithVotes } from "@/lib/collections/posts/fragments";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentModerationSidebarQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

export function useModeratedUserContents(userId: string, contentLimit = 20) {
  const { posts = [] } = usePublishedPosts(userId, contentLimit, false);
  const { data: commentsData } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId } },
      limit: contentLimit,
      enableTotal: false,
    },
    ssr: false,
  });

  const comments = useMemo(() => [...(commentsData?.comments?.results ?? [])], [commentsData]);

  // In ModerationContentDetail, we embed a post page wrapper into the moderation detail view.
  // Hydrating the apollo cache here lets us avoid a loading spinner when going through a user's posts that way.
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
  }, [posts]);

  return {
    posts,
    comments,
  };
}
