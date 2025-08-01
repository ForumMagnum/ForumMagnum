import React, { useCallback } from "react";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import NotifyMeToggleDropdownItem from "../dropdowns/NotifyMeToggleDropdownItem";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import EditCommentDropdownItem from "../dropdowns/comments/EditCommentDropdownItem";
import { useCurrentUserId } from "../common/withUser";
import BookmarkDropdownItem from "../dropdowns/posts/BookmarkDropdownItem";
import SeeLessDropdownItem from "../dropdowns/posts/SeeLessDropdownItem";

const UltraFeedCommentActions = ({ comment, post, closeMenu, showEdit, onSeeLess, isSeeLessMode }: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  closeMenu?: () => void,
  showEdit: () => void,
  onSeeLess?: () => void,
  isSeeLessMode?: boolean,
}) => {
  const currentUserId = useCurrentUserId();
  const url = comment.postId
    ? `${postGetPageUrl({ _id: comment.postId, slug: post?.slug ?? "" })}#${comment._id}`
    : commentGetPageUrlFromIds({ commentId: comment._id, postId: comment.postId ?? undefined, postSlug: post?.slug, tagSlug: undefined });

  const handleOpenInNewTab = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
    closeMenu?.();
  }, [url, closeMenu]);

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.origin + url);
    closeMenu?.();
  }, [url, closeMenu]);

  const handleSeeLess = useCallback(() => {
    onSeeLess?.();
    closeMenu?.();
  }, [onSeeLess, closeMenu]);

  const isOwnComment = currentUserId && (comment.userId === currentUserId);

  return (
    <DropdownMenu>
      {!isOwnComment &&
        <NotifyMeToggleDropdownItem
          document={comment.user}
          title={`Follow ${userGetDisplayName(comment.user)}`}
          subscriptionType="newActivityForFeed"
        />}
      <NotifyMeToggleDropdownItem
        document={comment}
        title="Subscribe to replies"
        subscriptionType="newReplies"
      />
      {onSeeLess && <SeeLessDropdownItem onSeeLess={handleSeeLess} isSeeLessMode={isSeeLessMode} />}
      <BookmarkDropdownItem documentId={comment._id} collectionName="Comments" />
      <DropdownItem
        title="Open in new tab"
        icon="ArrowRight"
        onClick={handleOpenInNewTab}
      />
      <DropdownItem
        title="Copy link"
        icon="Link"
        onClick={handleCopyLink}
      />
      <EditCommentDropdownItem comment={comment} showEdit={showEdit} />
    </DropdownMenu>
  );
};

export default UltraFeedCommentActions; 
