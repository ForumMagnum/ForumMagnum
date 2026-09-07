import React from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import { useOpenCitePopover } from "../../posts/CitePostPopoverContext";
import DropdownItem from "../DropdownItem";

/**
 * Opens the citation popover (see CitePostPopover) anchored to the button
 * that hosts this menu. Renders nothing if the menu isn't hosted by a button
 * that provides the popover.
 */
const CitePostDropdownItem = ({postId, closeMenu}: {
  postId: string,
  closeMenu?: () => void,
}) => {
  const {captureEvent} = useTracking();
  const openCitePopover = useOpenCitePopover();
  if (!openCitePopover) return null;

  const showCitePopover = () => {
    captureEvent("citePostClicked", {postId});
    closeMenu?.();
    openCitePopover();
  };

  return (
    <DropdownItem
      title="Cite"
      icon="Document"
      onClick={showCitePopover}
    />
  );
};

export default CitePostDropdownItem;
