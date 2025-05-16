import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useBookmarkPost } from "../../hooks/useBookmarkPost";
import DropdownItem from "../DropdownItem";

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

export default registerComponent(
  "BookmarkDropdownItem",
  BookmarkDropdownItem,
);


