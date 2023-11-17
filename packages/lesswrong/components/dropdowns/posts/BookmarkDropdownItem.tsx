import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { useBookmarkPost } from "../../hooks/useBookmarkPost";

const BookmarkDropdownItem = ({post}: {post: PostsBase}) => {
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

const BookmarkDropdownItemComponent = registerComponent(
  "BookmarkDropdownItem",
  BookmarkDropdownItem,
);

declare global {
  interface ComponentTypes {
    BookmarkDropdownItem: typeof BookmarkDropdownItemComponent
  }
}
