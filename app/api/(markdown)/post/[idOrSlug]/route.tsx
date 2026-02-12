import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { MarkdownPostDetail } from "@/server/markdownComponents/MarkdownPostDetail";
import { gql } from "@/lib/generated/gql-codegen";

const truthyValues = new Set(["1", "true", "yes", "on"]);

function parseBooleanParam(value: string | null): boolean {
  if (!value) return false;
  return truthyValues.has(value.toLowerCase());
}

function compactifyPostMarkdown(markdown: string): string {
  return markdown
    .replaceAll(/<table[\s\S]*?<\/table>/gi, "\n[Table omitted in compact mode]\n")
    .replaceAll(/\$\$[\s\S]*?\$\$/g, "\n[Equation omitted in compact mode]\n")
    .replaceAll(/!\[[^\]]*]\([^)]+\)/g, "[Image omitted in compact mode]")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
}

const PostMarkdownQuery = gql(`
  query PostMarkdownApi($_id: String!, $commentsLimit: Int) {
    post(selector: {_id: $_id}) {
      result {
        _id
        slug
        commentCount
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
    comments(selector: { postCommentsTop: { postId: $_id } }, limit: $commentsLimit) {
      results {
        _id
        parentCommentId
        postedAt
        baseScore
        voteCount
        votingSystem
        extendedScore
        user { slug displayName }
        contents { agentMarkdown plaintextMainText }
      }
    }
  }
`);

export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  const compactMode = parseBooleanParam(req.nextUrl.searchParams.get("compact"));
  if (!idOrSlug) return new Response('No ID or slug provided', { status: 400 });
  const resolverContext = await getContextFromReqAndRes({req});
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }
  const {data} = await runQuery(PostMarkdownQuery, {
    _id: rawPost?._id,
    commentsLimit: 50,
  }, resolverContext);
  const post = data?.post?.result;
  const topComments = (data?.comments?.results ?? [])
    .filter((comment) => !comment.parentCommentId)
    .slice(0, compactMode ? 3 : 5);

  if (!post) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }

  const bodyMarkdown = compactMode
    ? compactifyPostMarkdown(post.contents?.agentMarkdown ?? "")
    : (post.contents?.agentMarkdown ?? "");

  return await markdownResponse(
    <MarkdownPostDetail post={post} topComments={topComments} compactMode={compactMode} bodyMarkdown={bodyMarkdown} />
  );
}
