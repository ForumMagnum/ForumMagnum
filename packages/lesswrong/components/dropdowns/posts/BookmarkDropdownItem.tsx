import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useBookmarkPost } from "../../hooks/useBookmarkPost";
import { DropdownItem } from "../DropdownItem";

const BookmarkDropdownItemInner = ({post}: {post: PostsBase}) => {
  const {icon, labelText, toggleBookmark} = useBookmarkPost(post);
  return (
    <DropdownItem
      title={labelText}
      onClick={toggleBookmark}
      icon={icon}
    />
  );
}

export const BookmarkDropdownItem = registerComponent(
  "BookmarkDropdownItem",
  BookmarkDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    BookmarkDropdownItem: typeof BookmarkDropdownItem
  }
}
