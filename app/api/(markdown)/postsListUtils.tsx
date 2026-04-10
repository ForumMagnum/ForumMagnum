import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownPostsList } from "@/server/markdownComponents/MarkdownPostsList";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const POSTS_LIST_QUERY = gql(`
  query MarkdownLatestPosts($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...MarkdownPostsList
      }
    }
  }
`);

const parseLimit = (limitParam: string | null): number => {
  if (!limitParam) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(limitParam, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  if (parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

export const getPostsListLimit = (req: NextRequest): number =>
  parseLimit(req.nextUrl.searchParams.get("limit"));

export async function renderPostsListResponse(req: NextRequest, options: {
  title: string
  selector: PostSelector
}) {
  const resolverContext = await getContextFromReqAndRes({ req });
  const limit = getPostsListLimit(req);
  const { data } = await runQuery(POSTS_LIST_QUERY, {
    selector: options.selector,
    limit,
  }, resolverContext);

  const posts = data?.posts?.results ?? [];

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>{options.title}</div>
      <MarkdownPostsList posts={posts} />
    </div>
  );
}
