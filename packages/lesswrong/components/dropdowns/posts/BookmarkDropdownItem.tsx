import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useBookmark } from "../../hooks/useBookmark";
import { BookmarkableCollectionName } from "@/lib/collections/bookmarks/constants";
import DropdownItem from "../DropdownItem";

interface BookmarkDropdownItemProps {
  documentId: string;
  collectionName: BookmarkableCollectionName;
  /** The CommentActions menu is implemented with MUI's <Menu> component that automatically closes when a click is detected.
   * We have this optional prop to prevent the menu from closing when the bookmark is toggled.
   */
  preventMenuClose?: boolean;
}

const BookmarkDropdownItem = ({ 
  documentId,
  collectionName,
  preventMenuClose = false 
}: BookmarkDropdownItemProps) => {
  
  const { icon, labelText, toggleBookmark } = useBookmark(documentId, collectionName);
  
  const handleClick = (event: React.MouseEvent) => {
    if (preventMenuClose) {
      event.stopPropagation();
    }
    toggleBookmark(event);
  };
  
  return (
    <DropdownItem
      title={labelText}
      onClick={handleClick}
      icon={icon}
    />
  );
}

export default registerComponent(
  "BookmarkDropdownItem",
  BookmarkDropdownItem,
);


