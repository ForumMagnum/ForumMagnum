import { useQuery } from "@/lib/crud/useQuery";
import { usePublishedPosts } from "./usePublishedPosts";
import { gql } from "@/lib/generated/gql-codegen";
import { useMemo } from "react";
import { useHydrateModerationPostCache } from "./useHydrateModerationPostCache";
import { skipPollWhenHidden } from "./usePageVisibility";

const SunshineCommentsListMultiQuery = gql(`
  query multiCommentModerationSidebarQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineCommentsList
      }
      totalCount
    }
  }
`);

export function useModeratedUserContents(userId: string, contentLimit = 20, pollInterval?: number) {
  const { posts } = usePublishedPosts(userId, contentLimit, false, pollInterval);
  const { data: commentsData } = useQuery(SunshineCommentsListMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId } },
      limit: contentLimit,
      enableTotal: false,
    },
    ssr: false,
    pollInterval: userId ? pollInterval : undefined,
    skipPollAttempt: skipPollWhenHidden,
  });

  const comments = useMemo(() => [...(commentsData?.comments?.results ?? [])], [commentsData]);

  // In ModerationContentDetail, we embed a post page wrapper into the moderation detail view.
  // Hydrating the apollo cache here lets us avoid a loading spinner when going through a user's posts that way.
  useHydrateModerationPostCache(posts ?? []);

  return {
    posts: posts ?? [],
    comments,
    // True until both queries have returned once; until then the list may be partial.
    loading: posts === undefined || commentsData === undefined,
  };
}
