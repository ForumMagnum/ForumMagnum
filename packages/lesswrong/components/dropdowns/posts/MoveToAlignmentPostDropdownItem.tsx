import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { userCanMakeAlignmentPost } from "../../../lib/alignment-forum/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { useSetAlignmentPost } from "../../alignment-forum/withSetAlignmentPost";
import { isLWorAF } from "../../../lib/instanceSettings";

const MoveToAlignmentPostDropdownItemInner = ({post}: {post: PostsBase}) => {
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
    !isLWorAF ||
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

export const MoveToAlignmentPostDropdownItem = registerComponent(
  "MoveToAlignmentPostDropdownItem",
  MoveToAlignmentPostDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    MoveToAlignmentPostDropdownItem: typeof MoveToAlignmentPostDropdownItem
  }
}
