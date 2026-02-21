import { gql } from "@/lib/generated/gql-codegen";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { markdownClasses, markdownResponse, renderReactToMarkdown } from "@/server/markdownApi/markdownResponse";
import { MarkdownDate } from "@/server/markdownComponents/MarkdownDate";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { MarkdownPostsList } from "@/server/markdownComponents/MarkdownPostsList";
import { MarkdownUserLink } from "@/server/markdownComponents/MarkdownUserLink";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { getPostsListLimit } from "../../postsListUtils";

const USER_PROFILE_QUERY = gql(`
  query MarkdownUserProfile($slug: String!) {
    users(selector: { usersProfile: { slug: $slug } }, limit: 1) {
      results {
        _id
        slug
        displayName
        username
        bio
        karma
        afKarma
        postCount
        commentCount
        createdAt
      }
    }
  }
`);

const USER_POSTS_QUERY = gql(`
  query MarkdownUserProfilePosts($userId: String!, $postsLimit: Int) {
    topPosts: posts(
      selector: { userPosts: { userId: $userId, sortedBy: "top", excludeEvents: true } }
      limit: 3
    ) {
      results {
        ...MarkdownPostsList
      }
    }
    recentPosts: posts(
      selector: { userPosts: { userId: $userId, sortedBy: "new", excludeEvents: true } }
      limit: $postsLimit
    ) {
      results {
        ...MarkdownPostsList
      }
    }
  }
`);

const USER_RECENT_COMMENTS_QUERY = gql(`
  query MarkdownUserProfileRecentComments($userId: String!, $commentsLimit: Int) {
    comments(selector: { profileComments: { userId: $userId, sortBy: "new" } }, limit: $commentsLimit) {
      results {
        _id
        postedAt
        baseScore
        voteCount
        parentCommentId
        user { slug displayName }
        post {
          _id
          slug
          title
        }
        contents {
          agentMarkdown
          plaintextMainText
        }
      }
    }
  }
`);

const truncatePlaintext = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const getCommentBodyMarkdown = (comment: {
  contents?: {
    agentMarkdown?: string | null
    plaintextMainText?: string | null
  } | null
}): string => {
  const markdown = comment.contents?.agentMarkdown?.trim();
  if (markdown) return markdown;
  const plaintext = comment.contents?.plaintextMainText?.trim() ?? "";
  if (!plaintext) return "_[No comment body available]_";
  return truncatePlaintext(plaintext, 600);
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) {
    return new Response("No user slug provided", { status: 400 });
  }

  const resolverContext = await getContextFromReqAndRes({ req });
  const postsLimit = Math.min(getPostsListLimit(req), 20);
  const { data } = await runQuery(USER_PROFILE_QUERY, { slug }, resolverContext);

  const user = data?.users?.results?.[0];
  if (!user) {
    const markdown = await renderReactToMarkdown(
      <div>
        <div className={markdownClasses.title}>User Not Found</div>
        <div>No user found with slug: {slug}</div>
      </div>
    );
    return new Response(markdown, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const displayName = user.displayName || user.username || user.slug;
  const bioMarkdown = user.bio?.trim() ?? "";
  const { data: postsData } = await runQuery(USER_POSTS_QUERY, {
    userId: user._id,
    postsLimit,
  }, resolverContext);
  const { data: commentsData } = await runQuery(USER_RECENT_COMMENTS_QUERY, {
    userId: user._id,
    commentsLimit: 8,
  }, resolverContext);
  const topPosts = postsData?.topPosts?.results ?? [];
  const recentPosts = postsData?.recentPosts?.results ?? [];
  const recentComments = commentsData?.comments?.results ?? [];

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>User: {displayName}</div>
      <div>
        Profile URL (HTML): <a href={`/users/${user.slug}`}>{`/users/${user.slug}`}</a>
      </div>
      <div>
        Profile URL (Markdown): <a href={`/api/user/${user.slug}`}>{`/api/user/${user.slug}`}</a>
      </div>
      <ul>
        <li>Karma: {user.karma ?? 0}</li>
        {user.afKarma ? <li>Alignment Forum karma: {user.afKarma}</li> : null}
        <li>Posts: {user.postCount ?? 0}</li>
        <li>Comments: {user.commentCount ?? 0}</li>
        {user.createdAt ? <li>Member since: <MarkdownDate date={user.createdAt} /></li> : null}
      </ul>
      <h2>Bio</h2>
      {bioMarkdown ? (
        <MarkdownNode markdown={bioMarkdown} />
      ) : (
        <div><em>No bio.</em></div>
      )}
      {topPosts.length > 0 ? (
        <>
          <h2>Top Posts</h2>
          <MarkdownPostsList posts={topPosts} includeExcerpt={false} />
        </>
      ) : null}
      {recentPosts.length > 0 ? (
        <>
          <h2>Recent Posts</h2>
          <MarkdownPostsList posts={recentPosts} includeExcerpt={false} />
        </>
      ) : null}
      {recentComments.length > 0 ? (
        <>
          <h2>Recent Comments</h2>
          <div>
            {recentComments.map((comment) => {
              const post = comment.post;
              const postSlugOrId = post?.slug || post?._id;
              return (
                <div key={comment._id}>
                  <h3>
                    Comment
                    {comment.user ? <> by <MarkdownUserLink user={comment.user} /></> : ""}
                    {" "}on{" "}
                    {postSlugOrId ? (
                      <a href={`/api/post/${postSlugOrId}`}>{post?.title ?? "post"}</a>
                    ) : (
                      post?.title ?? "post"
                    )}
                  </h3>
                  <ul>
                    <li><MarkdownDate date={comment.postedAt} /></li>
                    <li>Karma: {comment.baseScore ?? 0}</li>
                    {comment.voteCount !== undefined && comment.voteCount !== null ? <li>Total votes: {comment.voteCount}</li> : null}
                    {postSlugOrId ? (
                      <li>
                        Comment URL (Markdown):{" "}
                        <a href={`/api/post/${postSlugOrId}/comments/${comment._id}`}>{`/api/post/${postSlugOrId}/comments/${comment._id}`}</a>
                      </li>
                    ) : null}
                    {post?.slug ? (
                      <li>
                        Comment URL (HTML):{" "}
                        <a href={`/posts/${post._id}/${post.slug}/comment/${comment._id}`}>{`/posts/${post._id}/${post.slug}/comment/${comment._id}`}</a>
                      </li>
                    ) : null}
                  </ul>
                  <MarkdownNode markdown={getCommentBodyMarkdown(comment)} indentLevel={1} />
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
