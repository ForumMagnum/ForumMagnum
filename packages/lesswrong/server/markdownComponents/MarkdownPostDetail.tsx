import React from "react";
import { markdownClasses } from "@/server/markdownApi/markdownResponse";
import { MarkdownNode } from "./MarkdownNode";
import { MarkdownUserLink } from "./MarkdownUserLink";
import { MarkdownDate } from "./MarkdownDate";
import { MarkdownCommentsList } from "./MarkdownCommentsList";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";

export function MarkdownPostDetail({
  post,
  topComments = [],
  compactMode = false,
  bodyMarkdown,
  sequence,
  prevPost,
  nextPost,
  htmlPathOverride,
  markdownPathOverride,
  commentsMarkdownPathOverride,
}: {
  post: PostMarkdownApiQuery_post_SinglePostOutput_result_Post
  topComments?: CommentsMarkdownFragment[]
  compactMode?: boolean
  bodyMarkdown?: string
  sequence?: PostMarkdownApiQuery_post_SinglePostOutput_result_Post_sequence_Sequence | null
  prevPost?: PostMarkdownApiQuery_post_SinglePostOutput_result_Post_prevPost_Post | null
  nextPost?: PostMarkdownApiQuery_post_SinglePostOutput_result_Post_nextPost_Post | null
  htmlPathOverride?: string
  markdownPathOverride?: string
  commentsMarkdownPathOverride?: string
}) {
  const isCurated = !!post.curatedDate;
  const frontpageLabel = post.frontpageDate ? "Frontpage" : "Personal Blog";
  const isLinkpost = post.postCategory === "linkpost";
  const isEvent = !!post.isEvent;
  const htmlPath = htmlPathOverride ?? postGetPageUrl(post, {isAbsolute: true, isApiVersion: false});
  const markdownPath = markdownPathOverride ?? postGetPageUrl(post, {isAbsolute: true, isApiVersion: true});
  const commentsMarkdownPath = commentsMarkdownPathOverride ?? `/api/post/${post.slug}/comments`;
  const compactPath = markdownPath.includes("?") ? `${markdownPath}&compact=1` : `${markdownPath}?compact=1`;

  return (
    <div>
      <div className={markdownClasses.title}>
        {post.draft ? "[Draft] " : ""}
        {post.title}
      </div>
      <ul>
        <li>
          By <MarkdownUserLink user={post.user} />
          {post.coauthors?.map((coauthor, index) => (
            <React.Fragment key={coauthor.slug ?? index}>
              {", "}
              <MarkdownUserLink user={coauthor} />
            </React.Fragment>
          ))}
        </li>
        <li><MarkdownDate date={post.postedAt} /></li>
        <li>{post.baseScore ?? 0} points</li>
        {isEvent && post.location ? <li>Location: {post.location}</li> : null}
        {isEvent && post.startTime ? <li>Starts: <MarkdownDate date={post.startTime} /></li> : null}
        {isEvent && post.endTime ? <li>Ends: <MarkdownDate date={post.endTime} /></li> : null}
        {isLinkpost && post.url && (
          <li>
            Linkpost: <a href={post.url}>{post.url}</a>
          </li>
        )}
        {isCurated && <li>Curated</li>}
        {post.tags && post.tags.length > 0
          ? post.tags.map((tag) => (
            <li key={tag._id}>
              Tag: <a href={`/w/${tag.slug}`}>{tag.name}</a>
            </li>
          ))
          : null}
        <li>{frontpageLabel}</li>
        <li>Comments: {post.commentCount ?? 0}</li>
        <li>
          Post URL (HTML):{" "}
          <a href={htmlPath}>{htmlPath}</a>
        </li>
        <li>
          Post URL (Markdown):{" "}
          <a href={markdownPath}>{markdownPath}</a>
        </li>
        <li>
          Comments URL (Markdown):{" "}
          <a href={commentsMarkdownPath}>{commentsMarkdownPath}</a>
        </li>
        <li>
          Post URL (Markdown, compact):{" "}
          <a href={compactPath}>{compactPath}</a>
        </li>
        {sequence ? (
          <li>
            Sequence: <a href={sequenceGetPageUrl(sequence, {isAbsolute: true, isApiVersion: false})}>{sequence.title ?? sequence._id}</a>{" "}
            (<a href={sequenceGetPageUrl(sequence, {isAbsolute: true, isApiVersion: true})}>Markdown</a>)
          </li>
        ) : null}
        {prevPost ? (
          <li>
            Previous in sequence: <a href={postGetPageUrl(prevPost, {isAbsolute: true, isApiVersion: false})}>{prevPost.title}</a>{" "}
            (<a href={postGetPageUrl(prevPost, {isAbsolute: true, isApiVersion: true})}>Markdown</a>)
          </li>
        ) : null}
        {nextPost ? (
          <li>
            Next in sequence: <a href={postGetPageUrl(nextPost, {isAbsolute: true, isApiVersion: false})}>{nextPost.title}</a>{" "}
            (<a href={postGetPageUrl(nextPost, {isAbsolute: true, isApiVersion: true})}>Markdown</a>)
          </li>
        ) : null}
        {compactMode ? <li>Mode: compact</li> : null}
      </ul>
      <MarkdownNode markdown={bodyMarkdown ?? post.contents?.agentMarkdown ?? ""} />
      {topComments.length > 0 ? (
        <>
          <h2>Top Comments Index</h2>
          <MarkdownCommentsList
            comments={topComments}
            includeBodies={false}
            markdownRouteBase={`/api/post/${post.slug}/comments`}
            htmlRouteBase={`/posts/${post._id}/${post.slug}/comment`}
          />
        </>
      ) : null}
    </div>
  );
}
