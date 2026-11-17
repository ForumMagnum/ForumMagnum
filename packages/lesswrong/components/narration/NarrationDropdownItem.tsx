"use client";
import React from "react";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import { usePostsPageContext } from "../posts/PostsPage/PostsPageContext";
import DropdownItem from "../dropdowns/DropdownItem";
import NarrationPlayer from "./NarrationPlayer";

/**
 * Opens the narration player for the post whose page this is. The player
 * highlights what it's reading in the post body, so it's only offered there.
 */
const NarrationDropdownItem = ({ post, closeMenu }: {
  post: PostsList|SunshinePostsList
  closeMenu: () => void
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const isOnPostPage = usePostsPageContext() !== null;

  if (!userIsAdmin(currentUser) || !isOnPostPage) {
    return null;
  }

  const openPlayer = () => {
    closeMenu();
    openDialog({
      name: "NarrationPlayer",
      closeOnNavigate: true,
      contents: ({ onClose }) => <NarrationPlayer postId={post._id} onClose={onClose} />,
    });
  };

  return <DropdownItem title="Listen (ElevenLabs prototype)" icon="VolumeUp" onClick={openPlayer} />;
};

export default NarrationDropdownItem;
