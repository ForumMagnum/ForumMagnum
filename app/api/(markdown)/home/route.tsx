import { gql } from "@/lib/generated/gql-codegen";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownPostsList } from "@/server/markdownComponents/MarkdownPostsList";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { getPostsListLimit } from "../postsListUtils";

const FRONT_PAGE_QUERY = gql(`
  query MarkdownFrontPage($recentLimit: Int, $latestLimit: Int) {
    currentSpotlight {
      _id
      customTitle
      customSubtitle
      post {
        _id
        slug
        title
      }
      sequence {
        _id
        title
      }
      tag {
        _id
        name
        slug
      }
    }
    curated: posts(selector: { curated: {} }, limit: 3) {
      results {
        ...MarkdownPostsList
      }
    }
    recent: posts(selector: { magic: {} }, limit: $recentLimit) {
      results {
        ...MarkdownPostsList
      }
    }
    latest: posts(selector: { new: {} }, limit: $latestLimit) {
      results {
        ...MarkdownPostsList
      }
    }
  }
`);

export async function GET(req: NextRequest) {
  const resolverContext = await getContextFromReqAndRes({ req });
  const limit = Math.min(getPostsListLimit(req), 6);
  const { data } = await runQuery(FRONT_PAGE_QUERY, {
    recentLimit: limit,
    latestLimit: limit
  }, resolverContext);
  const curatedPosts = data?.curated?.results ?? [];
  const curatedPostIds = new Set(curatedPosts.map((post) => post._id));
  const recentPosts = (data?.recent?.results ?? []).filter((post) => !curatedPostIds.has(post._id));
  const recentPostIds = new Set(recentPosts.map((post) => post._id));
  const latestPosts = (data?.latest?.results ?? []).filter(
    (post) => !curatedPostIds.has(post._id) && !recentPostIds.has(post._id)
  );

  const spotlight = data?.currentSpotlight;
  const spotlightTitle =
    spotlight?.customTitle ??
    spotlight?.post?.title ??
    spotlight?.sequence?.title ??
    spotlight?.tag?.name;

  const spotlightUrl =
    spotlight?.post
      ? `/posts/${spotlight.post._id}/${spotlight.post.slug}`
      : spotlight?.sequence
        ? `/s/${spotlight.sequence._id}`
        : spotlight?.tag
          ? `/w/${spotlight.tag.slug}`
          : null;

  const spotlightApiUrl = spotlight?.post
    ? `/api/post/${spotlight.post.slug || spotlight.post._id}`
    : null;

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Front Page</div>
      <div>
        Feed endpoints: <a href="/api/curated">/api/curated</a>, <a href="/api/recent">/api/recent</a>,{" "}
        <a href="/api/latest">/api/latest</a>.
      </div>
      {spotlightTitle && spotlightUrl ? (
        <div>
          <h2>Current Spotlight</h2>
          <div>
            <a href={spotlightApiUrl ?? spotlightUrl}>{spotlightTitle}</a>
          </div>
          {spotlight?.customSubtitle ? <div>{spotlight.customSubtitle}</div> : null}
        </div>
      ) : null}
      <h2>Recently Curated Posts</h2>
      <MarkdownPostsList posts={curatedPosts} includeExcerpt={false} />
      <h2>Recent Posts</h2>
      <MarkdownPostsList posts={recentPosts} includeExcerpt={false} />
      <h2>Latest Posts</h2>
      <MarkdownPostsList posts={latestPosts} includeExcerpt={false} />
    </div>
  );
}
