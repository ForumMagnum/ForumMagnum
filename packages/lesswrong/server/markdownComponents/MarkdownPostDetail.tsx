import React from "react";
import { markdownClasses } from "@/server/markdownApi/markdownResponse";
import { MarkdownNode } from "./MarkdownNode";
import { MarkdownUserLink } from "./MarkdownUserLink";
import { MarkdownDate } from "./MarkdownDate";
import { tagUrlBaseSetting } from "@/lib/instanceSettings";

interface MarkdownPostTag {
  _id: string
  name: string
  slug: string
}

interface MarkdownPostUser {
  slug: string
  displayName: string
}

interface MarkdownPostContents {
  agentMarkdown?: string | null
}

export interface MarkdownPostDetailData {
  _id: string
  slug: string
  title: string
  postedAt: string | Date
  baseScore?: number | null
  draft?: boolean | null
  curatedDate?: string | Date | null
  frontpageDate?: string | Date | null
  postCategory?: string | null
  url?: string | null
  user: MarkdownPostUser | null
  coauthors?: MarkdownPostUser[] | null
  tags?: MarkdownPostTag[] | null
  contents?: MarkdownPostContents | null
}

export function MarkdownPostDetail({ post }: { post: MarkdownPostDetailData }) {
  const tagUrlBase = tagUrlBaseSetting.get();
  const isCurated = !!post.curatedDate;
  const frontpageLabel = post.frontpageDate ? "Frontpage" : "Personal Blog";
  const isLinkpost = post.postCategory === "linkpost";

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
        {isLinkpost && post.url && (
          <li>
            Linkpost: <a href={post.url}>{post.url}</a>
          </li>
        )}
        {isCurated && <li>Curated</li>}
        {post.tags && post.tags.length > 0
          ? post.tags.map((tag) => (
            <li key={tag._id}>
              Tag: <a href={`/${tagUrlBase}/${tag.slug}`}>{tag.name}</a>
            </li>
          ))
          : null}
        <li>{frontpageLabel}</li>
        <li>
          Post URL (HTML):{" "}
          <a href={`/posts/${post._id}/${post.slug}`}>{`/posts/${post._id}/${post.slug}`}</a>
        </li>
        <li>
          Post URL (Markdown):{" "}
          <a href={`/api/post/${post.slug}`}>{`/api/post/${post.slug}`}</a>
        </li>
      </ul>
      <MarkdownNode markdown={post.contents?.agentMarkdown ?? ""} />
    </div>
  );
}
