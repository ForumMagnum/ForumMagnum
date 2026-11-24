import React from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import type { PostsMinimumForGetPageUrl } from "../../../lib/collections/posts/helpers";
import { postGetPrintUrl } from "../../hooks/usePostPrintView";
import DropdownItem from "../DropdownItem";

/**
 * Opens the post's print view in a new tab, which shows only the post and
 * opens the browser's print dialog, from which it can be saved as a PDF.
 */
const SaveAsPdfDropdownItem = ({post, closeMenu}: {
  post: PostsMinimumForGetPageUrl,
  closeMenu?: () => void,
}) => {
  const {captureEvent} = useTracking();

  const saveAsPdf = () => {
    captureEvent("savePostAsPdfClicked", {postId: post._id});
    closeMenu?.();
    window.open(postGetPrintUrl(post), "_blank");
  };

  return <DropdownItem title="Save as PDF" icon="Document" onClick={saveAsPdf} />;
};

export default SaveAsPdfDropdownItem;
