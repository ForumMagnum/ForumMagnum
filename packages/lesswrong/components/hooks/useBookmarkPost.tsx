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
  const documentInput = post ? { _id: post._id, __typename: "Post" as const } : null;
  const { icon, labelText, hoverText, toggleBookmark, loading } = useBookmark(documentInput);

  return {
    icon,
    labelText,
    hoverText,
    toggleBookmark,
  };
}
