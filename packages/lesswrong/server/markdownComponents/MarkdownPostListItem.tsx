import React from "react";
import { MarkdownDate } from "./MarkdownDate";
import { MarkdownUserLink } from "./MarkdownUserLink";
import { MarkdownNode } from "./MarkdownNode";
import { MarkdownPostTagsList } from "./MarkdownPostTagsList";

const buildUserLinkList = (users: UsersMinimumInfo[]): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < users.length; i += 1) {
    if (i > 0) {
      nodes.push(", ");
    }
    const user = users[i];
    nodes.push(<MarkdownUserLink key={user.slug} user={user} />);
  }
  return nodes;
};

export function MarkdownPostListItem({ post }: { post: MarkdownPostsList}) {
  const isCurated = !!post.curatedDate;
  const isLinkpost = post.postCategory === "linkpost";
  const coauthors = post.coauthors ?? [];
  const excerpt = post.contents?.agentMarkdownExcerpt ?? null;

  return (
    <div>
      <h2>
        <a href={`/api/post/${post.slug}`}>{post.title}</a>
      </h2>
      <div>
        By <MarkdownUserLink user={post.user} />
        {coauthors.length > 0 ? <> with {buildUserLinkList(coauthors)}</> : null}
        <br />
        <MarkdownDate date={post.postedAt} />
      </div>
      <ul>
        <li>Karma: {post.baseScore ?? 0}</li>
        {isCurated ? <li>Curated</li> : null}
        {isLinkpost ? (
          <li>
            Linkpost: {post.url ? <a href={post.url}>{post.url}</a> : "Missing URL"}
          </li>
        ) : null}
        <li>
          <MarkdownPostTagsList post={post} />
        </li>
      </ul>
      {excerpt && <MarkdownNode markdown={excerpt} />}
      <div>Read more: <a href={`/api/post/${post.slug}`}>{`/api/post/${post.slug}`}</a></div>
    </div>
  );
}
