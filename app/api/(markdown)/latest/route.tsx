import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownPostsList } from "@/server/markdownComponents/MarkdownPostsList";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";

const LatestPostsQuery = gql(`
  query MarkdownLatestPosts($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...MarkdownPostsList
      }
    }
  }
`);

export async function GET(req: NextRequest) {
  const resolverContext = await getContextFromReqAndRes({ req });
  const { data } = await runQuery(LatestPostsQuery, {
    selector: { new: {} },
    limit: 10,
  }, resolverContext);

  const posts = data?.posts?.results ?? [];

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Latest Posts</div>
      <MarkdownPostsList posts={posts} />
    </div>
  );
}
