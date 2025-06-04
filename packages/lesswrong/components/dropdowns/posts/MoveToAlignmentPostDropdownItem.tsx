import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { userCanMakeAlignmentPost } from "../../../lib/alignment-forum/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { useSetAlignmentPost } from "../../alignment-forum/withSetAlignmentPost";
import { isLWorAF } from "../../../lib/instanceSettings";
import DropdownItem from "../DropdownItem";

const MoveToAlignmentPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {setAlignmentPostMutation} = useSetAlignmentPost({fragmentName: "PostsList"});

  const handleMoveToAlignmentForum = () => {
    void setAlignmentPostMutation({
      variables: {
        postId: post._id,
        af: true,
      }
    })
  }

  const handleRemoveFromAlignmentForum = () => {
    void setAlignmentPostMutation({
      variables: {
        postId: post._id,
        af: false,
      }
    })
  }

  if (
    !isLWorAF ||
    !userCanMakeAlignmentPost(currentUser, post)
  ) {
    return null;
  }
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

export default registerComponent(
  "MoveToAlignmentPostDropdownItem",
  MoveToAlignmentPostDropdownItem,
);


