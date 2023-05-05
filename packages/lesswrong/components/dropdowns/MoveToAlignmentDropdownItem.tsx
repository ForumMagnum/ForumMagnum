import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import { userCanMakeAlignmentPost } from "../../lib/alignment-forum/users/helpers";
import { useCurrentUser } from "../common/withUser";
import { useSetAlignmentPost } from "../alignment-forum/withSetAlignmentPost";

const MoveToAlignmentDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {setAlignmentPostMutation} = useSetAlignmentPost({fragmentName: "PostsList"});

  const handleMoveToAlignmentForum = () => {
    void setAlignmentPostMutation({
      postId: post._id,
      af: true,
    })
  }

  const handleRemoveFromAlignmentForum = () => {
    void setAlignmentPostMutation({
      postId: post._id,
      af: false,
    })
  }

  if (
    isEAForum ||
    !userCanMakeAlignmentPost(currentUser, post)
  ) {
    return null;
  }

  const {DropdownItem} = Components;
  return post.af
    ? (
      <DropdownItem
        title="Ω Remove Alignment"
        onClick={handleRemoveFromAlignmentForum}
      />
    )
    : (
      <DropdownItem
        title="Ω Move to Alignment"
        onClick={handleMoveToAlignmentForum}
      />
    );
}

const MoveToAlignmentDropdownItemComponent = registerComponent(
  "MoveToAlignmentDropdownItem",
  MoveToAlignmentDropdownItem,
);

declare global {
  interface ComponentTypes {
    MoveToAlignmentDropdownItem: typeof MoveToAlignmentDropdownItemComponent
  }
}
