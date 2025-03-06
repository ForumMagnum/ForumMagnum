import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useBookmarkPost } from "../../hooks/useBookmarkPost";
import DropdownItem from "@/components/dropdowns/DropdownItem";

const BookmarkDropdownItem = ({post}: {post: PostsBase}) => {
  const {icon, labelText, toggleBookmark} = useBookmarkPost(post);
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

export default BookmarkDropdownItemComponent;
