import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { MarkdownUserLink } from "@/server/markdownComponents/MarkdownUserLink";
import { MarkdownDate } from "@/server/markdownComponents/MarkdownDate";
import { tagUrlBaseSetting } from "@/lib/instanceSettings";
import { gql } from "@/lib/generated/gql-codegen";
import React from "react";

const PostMarkdownQuery = gql(`
  query PostMarkdownApi($_id: String!) {
    post(selector: {_id: $_id}) {
      result {
        _id
        slug
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
  }
`);

export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  if (!idOrSlug) return new Response('No ID or slug provided', { status: 400 });
  const resolverContext = await getContextFromReqAndRes({req});
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }
  const {data} = await runQuery(PostMarkdownQuery, {
    _id: rawPost?._id,
  }, resolverContext);
  const post = data?.post?.result;

  if (!post) {
    return new Response('No post found with ID or slug: ' + idOrSlug, { status: 404 });
  }

  const tagUrlBase = tagUrlBaseSetting.get();
  const isCurated = !!post.curatedDate;
  const frontpageLabel = post.frontpageDate ? "Frontpage" : "Personal Blog";
  const hasCoauthors = post.coauthors && post.coauthors.length > 0;
  const isLinkpost = post.postCategory === "linkpost";

  return await markdownResponse(<div>
    <div className={markdownClasses.title}>
      {post.draft ? "[Draft] " : ""}
      {post.title}
    </div>
    <ul>
      <li>
        By <MarkdownUserLink user={post.user} />
        {post.coauthors?.map((coauthor,i) => <React.Fragment key={i}>
          {", "}<MarkdownUserLink user={coauthor} />
        </React.Fragment>)}
      </li>
      <li><MarkdownDate date={post.postedAt} /></li>
      <li>{post.baseScore ?? 0} points</li>
      {isLinkpost && post.url && <li>
        Linkpost: <a href={post.url}>{post.url}</a>
      </li>}
      {isCurated && <li>Curated</li>}
      {post.tags?.length && post.tags.map((tag,i) => 
        <li key={i}>Tag: <a href={`/${tagUrlBase}/${tag.slug}`}>{tag.name}</a></li>
      )}
      <li>{frontpageLabel}</li>
      <li>Post URL (HTML): <a href={`/posts/${post._id}/${post.slug}`}>{`/posts/${post._id}/${post.slug}`}</a></li>
      <li>Post URL (Markdown): <a href={`/api/post/${post.slug}`}>{`/api/post/${post.slug}`}</a></li>
    </ul>
    <MarkdownNode markdown={post.contents?.agentMarkdown ?? ""} />
  </div>);
}
