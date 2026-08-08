import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { MarkdownPostDetail } from "@/server/markdownComponents/MarkdownPostDetail";
import { MarkdownCommentsList } from "@/server/markdownComponents/MarkdownCommentsList";
import {
  MAX_COMMENTS_LIMIT,
  fetchPostCommentsForMarkdown,
  parseIncludeReactionUsers,
  parseLimit,
  parseSort,
} from "./postCommentsUtils";

const truthyValues = new Set(["1", "true", "yes", "on"]);

export function parseBooleanParam(value: string | null): boolean {
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

const PostMarkdownQuery = `
  query PostMarkdownApi($_id: String!, $commentsLimit: Int, $sequenceId: String) {
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
        isEvent
        location
        startTime
        endTime
        user { slug displayName }
        coauthors { slug displayName }
        tags { _id name slug }
        title
        contents { agentMarkdown }
        sequence(sequenceId: $sequenceId) {
          _id
          title
        }
        prevPost(sequenceId: $sequenceId) {
          _id
          slug
          title
        }
        nextPost(sequenceId: $sequenceId) {
          _id
          slug
          title
        }
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
`;

export async function fetchPostMarkdownDetail(
  postId: string,
  resolverContext: ResolverContext,
  options?: { sequenceId?: string, compactMode?: boolean },
) {
  const compactMode = options?.compactMode ?? false;
  const { data } = await runQuery(PostMarkdownQuery, {
    _id: postId,
    commentsLimit: 50,
    sequenceId: options?.sequenceId,
  }, resolverContext);
  const post = data?.post?.result;
  if (!post) return null;

  const topComments = (data?.comments?.results ?? [])
    .filter((comment: { parentCommentId?: string | null }) => !comment.parentCommentId)
    .slice(0, compactMode ? 3 : 5);

  const bodyMarkdown = compactMode
    ? compactifyPostMarkdown(post.contents?.agentMarkdown ?? "")
    : (post.contents?.agentMarkdown ?? "");

  return { post, topComments, bodyMarkdown };
}

interface RenderPostMarkdownOptions {
  sequenceId?: string
  htmlPathOverride?: string
  markdownPathOverride?: string
  commentsMarkdownPathOverride?: string
}

export async function renderPostMarkdownByIdOrSlug(
  req: NextRequest,
  idOrSlug: string,
  options?: RenderPostMarkdownOptions
): Promise<Response> {
  if (!idOrSlug) {
    return new Response("No ID or slug provided", { status: 400 });
  }
  const searchParams = req.nextUrl.searchParams;
  const compactMode = parseBooleanParam(searchParams.get("compact"));
  const includeComments = parseBooleanParam(searchParams.get("includeComments"));
  const resolverContext = await getContextFromReqAndRes({ req });
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const detail = await fetchPostMarkdownDetail(rawPost._id, resolverContext, {
    sequenceId: options?.sequenceId,
    compactMode,
  });
  if (!detail) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }
  const { post, topComments, bodyMarkdown } = detail;

  const postDetailElement = (
    <MarkdownPostDetail
      post={post}
      topComments={includeComments ? [] : topComments}
      compactMode={compactMode}
      bodyMarkdown={bodyMarkdown}
      sequence={post.sequence}
      prevPost={post.prevPost}
      nextPost={post.nextPost}
      htmlPathOverride={options?.htmlPathOverride}
      markdownPathOverride={options?.markdownPathOverride}
      commentsMarkdownPathOverride={options?.commentsMarkdownPathOverride}
    />
  );

  if (!includeComments) {
    return await markdownResponse(postDetailElement);
  }

  const sort = parseSort(searchParams.get("sort"));
  const limit = parseLimit(searchParams.get("limit"));
  const includeReactionUsers = parseIncludeReactionUsers(searchParams.get("includeReactionUsers"));
  const comments = await fetchPostCommentsForMarkdown(rawPost._id, sort, limit, resolverContext);
  const commentCount = post.commentCount ?? comments.length;
  const isTruncated = commentCount > comments.length;

  return await markdownResponse(
    <div>
      {postDetailElement}
      <h2>Comments</h2>
      <div>
        Showing {comments.length} of {commentCount} comments (sort={sort}).
      </div>
      {isTruncated ? (
        <div>
          To load more comments, increase <code>?limit=...</code> (max {MAX_COMMENTS_LIMIT}).
        </div>
      ) : null}
      <div>
        {includeReactionUsers
          ? "Reaction user names: included."
          : <>For reaction user names, use <code>?includeReactionUsers=1</code>.</>}
      </div>
      <MarkdownCommentsList
        comments={comments}
        includeReactionUsers={includeReactionUsers}
        markdownRouteBase={`/api/post/${post.slug}/comments`}
        htmlRouteBase={`/posts/${post._id}/${post.slug}/comment`}
      />
    </div>
  );
}
