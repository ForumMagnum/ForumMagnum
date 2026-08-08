import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";
import { MarkdownCommentsList } from "@/server/markdownComponents/MarkdownCommentsList";
import {
  MAX_COMMENTS_LIMIT,
  fetchPostCommentsForMarkdown,
  parseIncludeReactionUsers,
  parseLimit,
  parseSort,
} from "../../postCommentsUtils";

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

  const comments = await fetchPostCommentsForMarkdown(rawPost._id, sort, limit, resolverContext);
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
