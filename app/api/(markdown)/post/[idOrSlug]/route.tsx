import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { MarkdownPostDetail } from "@/server/markdownComponents/MarkdownPostDetail";
import { gql } from "@/lib/generated/gql-codegen";

const PostMarkdownQuery = gql(`
  query PostMarkdownApi($_id: String!) {
    post(selector: {_id: $_id}) {
      result {
        _id
        slug
        baseScore
        postedAt
        draft
        curatedDate
        frontpageDate
        postCategory
        url
        user { slug displayName }
        coauthors { slug displayName }
        tags { _id name slug }
        title
        contents { agentMarkdown }
      }
    }
  }
`);

export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  if (!idOrSlug) return new Response('No ID or slug provided', { status: 400 });
  const resolverContext = await getContextFromReqAndRes({req});
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }
  const {data} = await runQuery(PostMarkdownQuery, {
    _id: rawPost?._id,
  }, resolverContext);
  const post = data?.post?.result;

  if (!post) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }

  return await markdownResponse(<MarkdownPostDetail post={post} />);
}
