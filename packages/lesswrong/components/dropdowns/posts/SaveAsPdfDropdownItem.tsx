import React from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import { postGetPrintUrl, PostsMinimumForGetPageUrl } from "../../../lib/collections/posts/helpers";
import { usePostsPageContext } from "../../posts/PostsPage/PostsPageContext";
import { printPostOnly } from "../../posts/printPostOnly";
import DropdownItem from "../DropdownItem";

/**
 * Opens the browser's print dialog for the post, from which it can be saved
 * as a PDF. Print styles on the post page hide the site chrome, table of
 * contents, comments and recommendations so that only the post itself is
 * printed. If the menu is opened from somewhere other than the post's own
 * (fully loaded) page, e.g. a post list, the post page is opened in a new tab
 * and prints once it has loaded.
 */
const SaveAsPdfDropdownItem = ({post, closeMenu}: {
  post: PostsMinimumForGetPageUrl,
  closeMenu?: () => void,
}) => {
  const {captureEvent} = useTracking();
  const postsPageContext = usePostsPageContext();
  const isOnLoadedPostPage = postsPageContext?.fullPost?._id === post._id;

  const saveAsPdf = () => {
    captureEvent("savePostAsPdfClicked", {postId: post._id});
    closeMenu?.();
    if (isOnLoadedPostPage) {
      // Let the menu finish closing before the print dialog freezes rendering
      window.setTimeout(printPostOnly, 0);
    } else {
      window.open(postGetPrintUrl(post), "_blank");
    }
  };

  return (
    <DropdownItem
      title="Save as PDF"
      icon="Document"
      onClick={saveAsPdf}
    />
  );
};

export default SaveAsPdfDropdownItem;
