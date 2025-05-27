import React, { useCallback } from "react";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import NotifyMeToggleDropdownItem from "../dropdowns/NotifyMeToggleDropdownItem";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

const UltraFeedCommentActions = ({ comment, post, currentUser, closeMenu }: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  showEdit: () => void,
  currentUser: UsersCurrent,
  closeMenu?: () => void,
}) => {

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

  const isOwnComment = currentUser && (comment.userId === currentUser._id);

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
      <DropdownItem
        title="Copy link"
        icon="Link"
        onClick={handleCopyLink}
      />
      <DropdownItem
        title="Open in new tab"
        icon="ArrowRight"
        onClick={handleOpenInNewTab}
      />
    </DropdownMenu>
  );
};

export default UltraFeedCommentActions; 
