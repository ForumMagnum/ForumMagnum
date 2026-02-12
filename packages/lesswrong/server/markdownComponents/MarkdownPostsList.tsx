import React from "react";
import { MarkdownPostListItem } from "./MarkdownPostListItem";

export function MarkdownPostsList({
  posts,
  includeExcerpt = true,
}: {
  posts: MarkdownPostsList[]
  includeExcerpt?: boolean
}) {
  return (
    <div>
      {posts.map((post) => (
        <MarkdownPostListItem key={post._id} post={post} includeExcerpt={includeExcerpt} />
      ))}
    </div>
  );
}
