import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { MarkdownUserLink } from "@/server/markdownComponents/MarkdownUserLink";
import { MarkdownDate } from "@/server/markdownComponents/MarkdownDate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  if (!idOrSlug) return new Response('No ID or slug provided', { status: 400 });
  const resolverContext = await getContextFromReqAndRes({req});
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }
  const {data} = await runQuery(gql(`
    query Post($_id: String!) {
      post(selector: {_id: $_id}) {
        result {
          _id slug
          postedAt
          user { slug displayName }
          title
          contents { markdown }
        }
      }
    }
  `), {
    _id: rawPost?._id,
  }, resolverContext);
  const post = data?.post?.result;

  if (!post) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }

  return await markdownResponse(<div>
    <div className={markdownClasses.title}>{post.title}</div>
    <div>
      By <MarkdownUserLink user={post.user} /><br/>
      <MarkdownDate date={post.postedAt} />
    </div>
    <MarkdownNode markdown={post.contents?.markdown ?? ""} />
  </div>);
}
