import React, { useCallback } from "react";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { useLocation } from "../../../lib/routeUtil";
import { useTracking } from "../../../lib/analyticsEvents";
import DropdownItem from "../DropdownItem";

const OpenQuickTakeInNewTabDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
}) => {
  const { captureEvent } = useTracking();
  const { pathname } = useLocation();

  const handleOpenInNewTab = useCallback(() => {
    const url = commentGetPageUrlFromIds({
      postId: comment.postId,
      postSlug: post?.slug,
      commentId: comment._id,
    });
    captureEvent("openQuickTakeInNewTab", {commentId: comment._id});
    window.open(url, "_blank", "noopener,noreferrer");
  }, [comment._id, comment.postId, post?.slug, captureEvent]);

  // Don't show when already viewing the quick take's own post page (e.g. its
  // permalink), where opening it in a new tab would be redundant.
  const onOwnPostPage = pathname.startsWith(`/posts/${comment.postId}`);
  if (!comment.shortform || comment.topLevelCommentId || !comment.postId || comment.draft || onOwnPostPage) {
    return null;
  }

  return (
    <DropdownItem
      title="Open in new tab"
      icon="ArrowRight"
      onClick={handleOpenInNewTab}
    />
  );
};

export default OpenQuickTakeInNewTabDropdownItem;
