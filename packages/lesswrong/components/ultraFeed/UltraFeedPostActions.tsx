import React, { useCallback } from "react";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import SuggestCuratedDropdownItem from "../dropdowns/posts/SuggestCuratedDropdownItem";
import { defineStyles, useStyles } from "../hooks/useStyles";
import NotifyMeToggleDropdownItem from "../dropdowns/NotifyMeToggleDropdownItem";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

const styles = defineStyles("UltraFeedPostActions", (theme: ThemeType) => ({
  root: {
    minWidth: 300
  },
}));

const UltraFeedPostActions = ({ post, closeMenu, includeBookmark }: {
  post: PostsListWithVotes,
  closeMenu: () => void,
  includeBookmark?: boolean,
}) => {
  const classes = useStyles(styles);

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

  const author = post.user;

  return (
    <DropdownMenu className={classes.root}>
      {author && <NotifyMeToggleDropdownItem
        document={author}
        title={`Follow ${userGetDisplayName(author)}`}
        subscriptionType="newActivityForFeed"
      />}
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