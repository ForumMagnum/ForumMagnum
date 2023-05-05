import { MouseEvent, useState } from "react";
import { useDialog } from "../common/withDialog";
import { useCurrentUser } from "../common/withUser";
import { pluck } from "underscore";
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useMutation } from "@apollo/client";
import { fragmentTextForQuery } from "../../lib/vulcan-lib";
import type { ForumIconName } from "../common/ForumIcon";

export type BookmarkPost = {
  icon: ForumIconName,
  title: string,
  toggleBookmark: (event: MouseEvent) => void,
}

export const useBookmarkPost = (post: PostsBase): BookmarkPost => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const [bookmarked, setBookmarkedState] = useState(pluck((currentUser?.bookmarkedPostsMetadata || []), 'postId')?.includes(post._id));
  const {captureEvent} = useTracking();

  const [setIsBookmarkedMutation] = useMutation(gql`
    mutation setIsBookmarked($postId: String!, $isBookmarked: Boolean!) {
      setIsBookmarked(postId: $postId, isBookmarked: $isBookmarked) {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery("UsersCurrent")}
  `);

  const setBookmarked = (isBookmarked: boolean) => {
    setBookmarkedState(isBookmarked)
    void setIsBookmarkedMutation({
      variables: {postId: post._id, isBookmarked},
    });
  };

  const toggleBookmark = (event: MouseEvent) => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
      event.preventDefault();
      return;
    }

    setBookmarked(!bookmarked);
    captureEvent("bookmarkToggle", {"postId": post._id, "bookmarked": !bookmarked});
  }

  return {
    icon: bookmarked ? "Bookmark" : "BookmarkBorder",
    title: bookmarked ? "Un-bookmark" : "Bookmark",
    toggleBookmark,
  };
}
