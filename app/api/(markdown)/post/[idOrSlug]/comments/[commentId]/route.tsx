import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { collectAncestorCommentIds } from "@/server/markdownApi/commentAncestors";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";
import { MarkdownCommentsList } from "@/server/markdownComponents/MarkdownCommentsList";
import { MarkdownPostDetail } from "@/server/markdownComponents/MarkdownPostDetail";
import { fetchPostMarkdownDetail, parseBooleanParam } from "../../../postMarkdownUtils";

const COMMENT_QUERY = gql(`
  query PostMarkdownCommentById($commentId: String!) {
    comment(selector: {_id: $commentId}) {
      result {
        ...CommentsMarkdownFragment
      }
    }
  }
`);

const ANCESTORS_QUERY = gql(`
  query PostMarkdownCommentAncestors($commentIds: [String!], $limit: Int) {
    comments(selector: { default: { commentIds: $commentIds } }, limit: $limit) {
      results {
        ...CommentsMarkdownFragment
      }
    }
  }
`);

async function loadParentCommentId(
  resolverContext: ResolverContext,
  commentId: string,
): Promise<string | null> {
  const parent = await resolverContext.loaders.Comments.load(commentId);
  return parent?.parentCommentId ?? null;
}

async function fetchAncestorComments(
  comment: CommentsMarkdownFragment,
  resolverContext: ResolverContext,
): Promise<CommentsMarkdownFragment[]> {
  const ancestorIds = await collectAncestorCommentIds(
    comment.parentCommentId ?? null,
    (commentId) => loadParentCommentId(resolverContext, commentId),
  );
  if (!ancestorIds.length) return [];

  const { data } = await runQuery(ANCESTORS_QUERY, {
    commentIds: ancestorIds,
    limit: ancestorIds.length,
  }, resolverContext);
  const ancestorsById = new Map(
    (data?.comments?.results ?? []).map((ancestor) => [ancestor._id, ancestor]),
  );
  // Deleted or access-filtered ancestors are simply dropped; MarkdownCommentsList
  // tolerates gaps in the parent chain when computing reply depth.
  return ancestorIds
    .map((_id) => ancestorsById.get(_id))
    .filter((ancestor) => !!ancestor);
}

export async function GET(req: NextRequest, {
  params,
}: {
  params: Promise<{ idOrSlug: string, commentId: string }>
}) {
  const { idOrSlug, commentId } = await params;
  if (!idOrSlug) return new Response("No post ID or slug provided", { status: 400 });
  if (!commentId) return new Response("No comment ID provided", { status: 400 });

  const includeParents = parseBooleanParam(req.nextUrl.searchParams.get("includeParents"));
  const resolverContext = await getContextFromReqAndRes({ req });
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  // The single-comment resolver throws app.missing_document (rather than
  // returning null) when the comment doesn't exist or isn't visible.
  let comment: CommentsMarkdownFragment | null = null;
  try {
    const { data } = await runQuery(COMMENT_QUERY, { commentId }, resolverContext);
    comment = data?.comment?.result ?? null;
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "app.missing_document") {
      throw error;
    }
  }
  if (!comment || comment.postId !== rawPost._id) {
    return new Response("Comment not found for this post: " + commentId, { status: 404 });
  }

  if (!includeParents) {
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
      </div>
    );
  }

  const detail = await fetchPostMarkdownDetail(rawPost._id, resolverContext);
  if (!detail) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }
  const { post, bodyMarkdown } = detail;
  const ancestors = await fetchAncestorComments(comment, resolverContext);

  return await markdownResponse(
    <div>
      <MarkdownPostDetail
        post={post}
        topComments={[]}
        bodyMarkdown={bodyMarkdown}
        sequence={post.sequence}
        prevPost={post.prevPost}
        nextPost={post.nextPost}
      />
      <h2>Comment thread</h2>
      <div>
        Showing the comment and its {ancestors.length} parent comment{ancestors.length === 1 ? "" : "s"} (oldest first).
      </div>
      <MarkdownCommentsList
        comments={[...ancestors, comment]}
        includeReactionUsers={true}
        markdownRouteBase={`/api/post/${rawPost.slug}/comments`}
        htmlRouteBase={`/posts/${rawPost._id}/${rawPost.slug}/comment`}
      />
    </div>
  );
}
