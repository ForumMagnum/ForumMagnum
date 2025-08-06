import { registerComponent } from "../../lib/vulcan-lib/components";
import React, { useCallback } from "react";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import SuggestCuratedDropdownItem from "../dropdowns/posts/SuggestCuratedDropdownItem";
import { defineStyles, useStyles } from "../hooks/useStyles";
import NotifyMeToggleDropdownItem from "../dropdowns/NotifyMeToggleDropdownItem";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { useCurrentUser } from "../common/withUser";
import SeeLessDropdownItem from "../dropdowns/posts/SeeLessDropdownItem";
import BookmarkDropdownItem from "../dropdowns/posts/BookmarkDropdownItem";

const styles = defineStyles("UltraFeedPostActions", (theme: ThemeType) => ({
  root: {
    minWidth: 300
  },
}));

const UltraFeedPostActions = ({ post, closeMenu, includeBookmark, onSeeLess, isSeeLessMode }: {
  post: PostsListWithVotes,
  closeMenu: () => void,
  includeBookmark?: boolean,
  onSeeLess?: () => void,
  isSeeLessMode?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const handleOpenNewTab = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    window.open(postGetPageUrl(post), "_blank", "noopener,noreferrer");
    closeMenu();
  }, [post, closeMenu]);

  const handleCopyLink = useCallback(() => {
    const url = postGetPageUrl(post, true);
    void navigator.clipboard.writeText(url);
    closeMenu();
  }, [post, closeMenu]);

  const handleSeeLess = useCallback(() => {
    onSeeLess?.();
    closeMenu();
  }, [onSeeLess, closeMenu]);

  const author = post.user;
  const userIsAuthor = currentUser?._id === author?._id;

  return (
    <DropdownMenu className={classes.root}>
      {author && !userIsAuthor && <NotifyMeToggleDropdownItem
        document={author}
        title={`Follow ${userGetDisplayName(author)}`}
        subscriptionType="newActivityForFeed"
      />}
      {onSeeLess && <SeeLessDropdownItem onSeeLess={handleSeeLess} isSeeLessMode={isSeeLessMode} />}
      {includeBookmark && <BookmarkDropdownItem documentId={post._id} collectionName="Posts" />}
      <DropdownItem
        title="Copy link"
        icon="Link"
        onClick={handleCopyLink}
      />
      <DropdownItem
        title="Open in new tab"
        icon="ArrowRight"
        onClick={handleOpenNewTab}
      />
      <SuggestCuratedDropdownItem post={post} />
    </DropdownMenu>
  );
};

export default UltraFeedPostActions;
