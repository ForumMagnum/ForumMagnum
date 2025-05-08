import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useBookmarkPost } from "../../hooks/useBookmarkPost";

const BookmarkDropdownItemInner = ({post}: {post: PostsBase}) => {
  const {icon, labelText, toggleBookmark} = useBookmarkPost(post);
  const {DropdownItem} = Components;
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
