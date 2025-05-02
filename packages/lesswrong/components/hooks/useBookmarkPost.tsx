import React, { MouseEvent } from "react";
import type { ForumIconName } from "../common/ForumIcon";
import { useBookmark } from "./useBookmark";

export type BookmarkPost = {
  icon: ForumIconName,
  labelText: string,
  hoverText: string,
  toggleBookmark: (event?: MouseEvent) => void,
}

export const useBookmarkPost = (post: PostsMinimumInfo | null | undefined): BookmarkPost => {
  const { icon, labelText, hoverText, toggleBookmark, loading } = useBookmark(post?._id, "Posts");

  return {
    icon,
    labelText,
    hoverText,
    toggleBookmark,
  };
}
