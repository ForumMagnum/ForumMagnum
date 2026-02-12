import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";
import { MarkdownCommentsList } from "@/server/markdownComponents/MarkdownCommentsList";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2000;

const parseLimit = (limitParam: string | null): number => {
  if (!limitParam) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(limitParam, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

const parseSort = (sortParam: string | null): "top" | "new" | "old" => {
  if (sortParam === "top" || sortParam === "new" || sortParam === "old") {
    return sortParam;
  }
  return "top";
};

const parseIncludeReactionUsers = (value: string | null): boolean => {
  return value === "1" || value === "true";
};

const POST_QUERY = gql(`
  query PostMarkdownCommentsPost($_id: String!) {
    post(selector: {_id: $_id}) {
      result {
        _id
        slug
        title
        commentCount
      }
    }
  }
`);

const TOP_COMMENTS_QUERY = gql(`
  query PostMarkdownCommentsTop($_id: String!, $limit: Int) {
    comments(selector: { postCommentsTop: { postId: $_id } }, limit: $limit) {
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

const NEW_COMMENTS_QUERY = gql(`
  query PostMarkdownCommentsNew($_id: String!, $limit: Int) {
    comments(selector: { postCommentsNew: { postId: $_id } }, limit: $limit) {
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

const OLD_COMMENTS_QUERY = gql(`
  query PostMarkdownCommentsOld($_id: String!, $limit: Int) {
    comments(selector: { postCommentsOld: { postId: $_id } }, limit: $limit) {
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
  if (!idOrSlug) return new Response("No ID or slug provided", { status: 400 });
  const resolverContext = await getContextFromReqAndRes({ req });
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
  const sort = parseSort(req.nextUrl.searchParams.get("sort"));
  const includeReactionUsers = parseIncludeReactionUsers(req.nextUrl.searchParams.get("includeReactionUsers"));
  const { data: postData } = await runQuery(POST_QUERY, { _id: rawPost._id }, resolverContext);
  const post = postData?.post?.result;

  if (!post) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const queryBySort = sort === "new"
    ? NEW_COMMENTS_QUERY
    : sort === "old"
      ? OLD_COMMENTS_QUERY
      : TOP_COMMENTS_QUERY;
  const { data: commentsData } = await runQuery(queryBySort, {
    _id: rawPost._id,
    limit,
  }, resolverContext);
  const comments = commentsData?.comments?.results ?? [];
  const commentCount = post.commentCount ?? comments.length;
  const isTruncated = commentCount > comments.length;

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Comments: {post.title}</div>
      <div>
        Post URL (Markdown): <a href={`/api/post/${post.slug}`}>{`/api/post/${post.slug}`}</a>
      </div>
      <div>
        Post URL (HTML): <a href={`/posts/${post._id}/${post.slug}`}>{`/posts/${post._id}/${post.slug}`}</a>
      </div>
      <div>
        Showing {comments.length} of {commentCount} comments (sort={sort}).
      </div>
      {isTruncated ? (
        <div>
          To load more comments, increase <code>?limit=...</code> (max {MAX_LIMIT}).
        </div>
      ) : null}
      <div>
        For reaction user names, use <code>?includeReactionUsers=1</code>.
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
