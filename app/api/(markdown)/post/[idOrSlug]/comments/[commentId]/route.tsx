import { findPostByIdOrSlug, isWebLinksRequest } from "@/server/markdownApi/apiUtil";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";
import { MarkdownCommentsList } from "@/server/markdownComponents/MarkdownCommentsList";

const COMMENT_QUERY = gql(`
  query PostMarkdownCommentById($commentId: String!, $webLinks: Boolean!) {
    comment(selector: {_id: $commentId}) {
      result {
        ...CommentsMarkdownFragment
        contents { markdown @include(if: $webLinks) }
      }
    }
  }
`);

export async function GET(req: NextRequest, {
  params,
}: {
  params: Promise<{ idOrSlug: string, commentId: string }>
}) {
  const { idOrSlug, commentId } = await params;
  if (!idOrSlug) return new Response("No post ID or slug provided", { status: 400 });
  if (!commentId) return new Response("No comment ID provided", { status: 400 });

  const webLinks = isWebLinksRequest(req);
  const resolverContext = await getContextFromReqAndRes({ req });
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const { data } = await runQuery(COMMENT_QUERY, { commentId, webLinks }, resolverContext);
  const result = data?.comment?.result;
  if (!result || result.postId !== rawPost._id) {
    return new Response("Comment not found for this post: " + commentId, { status: 404 });
  }
  // With webLinks, render the body with its original (non-API) links
  const comment = webLinks && result.contents
    ? { ...result, contents: { ...result.contents, agentMarkdown: result.contents.markdown ?? null } }
    : result;

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Comment on {rawPost.title}</div>
      <div>
        Full comments page:{" "}
        <a href={`/api/post/${rawPost.slug}/comments`}>{`/api/post/${rawPost.slug}/comments`}</a>
      </div>
      <MarkdownCommentsList
        comments={[comment]}
        includeReactionUsers={true}
        markdownRouteBase={`/api/post/${rawPost.slug}/comments`}
        htmlRouteBase={`/posts/${rawPost._id}/${rawPost.slug}/comment`}
      />
    </div>,
    resolverContext.forumType,
    { absoluteLinks: webLinks },
  );
}
