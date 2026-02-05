import React from "react";
import { MarkdownPostListItem } from "./MarkdownPostListItem";

export function MarkdownPostsList({ posts }: { posts: MarkdownPostsList[] }) {
  return (
    <div>
      {posts.map((post) => (
        <MarkdownPostListItem key={post._id} post={post} />
      ))}
    </div>
  );
}
