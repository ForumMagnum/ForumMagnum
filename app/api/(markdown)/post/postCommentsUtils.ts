import { runQuery } from "@/server/vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";

export const DEFAULT_COMMENTS_LIMIT = 200;
export const MAX_COMMENTS_LIMIT = 2000;

export type PostCommentsSort = "top" | "new" | "old";

export const parseLimit = (limitParam: string | null): number => {
  if (!limitParam) return DEFAULT_COMMENTS_LIMIT;
  const parsed = Number.parseInt(limitParam, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_COMMENTS_LIMIT;
  return Math.min(parsed, MAX_COMMENTS_LIMIT);
};

export const parseSort = (sortParam: string | null): PostCommentsSort => {
  if (sortParam === "top" || sortParam === "new" || sortParam === "old") {
    return sortParam;
  }
  return "top";
};

export const parseIncludeReactionUsers = (value: string | null): boolean => {
  return value === "1" || value === "true";
};

const TOP_COMMENTS_QUERY = gql(`
  query PostMarkdownCommentsTop($_id: String!, $limit: Int) {
    comments(selector: { postCommentsTop: { postId: $_id } }, limit: $limit) {
      results {
        ...CommentsMarkdownFragment
      }
    }
  }
`);

const NEW_COMMENTS_QUERY = gql(`
  query PostMarkdownCommentsNew($_id: String!, $limit: Int) {
    comments(selector: { postCommentsNew: { postId: $_id } }, limit: $limit) {
      results {
        ...CommentsMarkdownFragment
      }
    }
  }
`);

const OLD_COMMENTS_QUERY = gql(`
  query PostMarkdownCommentsOld($_id: String!, $limit: Int) {
    comments(selector: { postCommentsOld: { postId: $_id } }, limit: $limit) {
      results {
        ...CommentsMarkdownFragment
      }
    }
  }
`);

export async function fetchPostCommentsForMarkdown(
  postId: string,
  sort: PostCommentsSort,
  limit: number,
  resolverContext: ResolverContext,
): Promise<CommentsMarkdownFragment[]> {
  const queryBySort = sort === "new"
    ? NEW_COMMENTS_QUERY
    : sort === "old"
      ? OLD_COMMENTS_QUERY
      : TOP_COMMENTS_QUERY;
  const { data } = await runQuery(queryBySort, { _id: postId, limit }, resolverContext);
  return data?.comments?.results ?? [];
}
