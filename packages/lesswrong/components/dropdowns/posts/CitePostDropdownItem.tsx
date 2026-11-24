import React, { useContext } from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import { OpenCitePopoverContext } from "../../posts/CitePostPopover";
import DropdownItem from "../DropdownItem";

/**
 * Opens the citation popover (see useCitePostPopover) anchored to the button
 * that hosts this menu. Renders nothing if the menu isn't hosted by a button
 * that provides the popover. A draft is not citable: its URL 404s for everyone else, and the
 * popover's "archive now" link would snapshot that 404 page.
 */
const CitePostDropdownItem = ({post, closeMenu}: {
  post: {_id: string, draft?: boolean | null},
  closeMenu?: () => void,
}) => {
  const {captureEvent} = useTracking();
  const openCitePopover = useContext(OpenCitePopoverContext);
  if (!openCitePopover || post.draft) return null;

  const showCitePopover = () => {
    captureEvent("citePostClicked", {postId: post._id});
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
