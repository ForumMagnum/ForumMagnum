import { useQuery } from "@/lib/crud/useQuery";
import { usePublishedPosts } from "./usePublishedPosts";
import { gql } from "@/lib/generated/gql-codegen";
import { useMemo } from "react";
import { useHydrateModerationPostCache } from "./useHydrateModerationPostCache";

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
  useHydrateModerationPostCache(posts);

  return {
    posts,
    comments,
  };
}
