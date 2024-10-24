import React from "react";
import { registerComponent, Components, fragmentTextForQuery } from "../../../lib/vulcan-lib";
import { userCanMakeAlignmentPost } from "../../../lib/alignment-forum/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { useMutate } from "@/components/hooks/useMutate";
import { gql } from "@apollo/client";
import { isLWorAF } from "../../../lib/instanceSettings";

const MoveToAlignmentPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const { mutate } = useMutate();

  const setPostIsAf = async (postId: string, af: boolean) => {
    await mutate({
      mutation: gql`
        mutation setPostIsAf($postId: String, $af: Boolean {
          mutation alignmentPost(postId: $postId, af: $af) {
            ...PostsList
          }
          ${fragmentTextForQuery("PostsList")}
        },
      `,
      variables: { postId, af },
      errorHandling: "flashMessageAndReturn",
    });
  }

  const handleMoveToAlignmentForum = () => {
    void setPostIsAf(post._id, true);
  }

  const handleRemoveFromAlignmentForum = () => {
    void setPostIsAf(post._id, false);
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

const MoveToAlignmentPostDropdownItemComponent = registerComponent(
  "MoveToAlignmentPostDropdownItem",
  MoveToAlignmentPostDropdownItem,
);

declare global {
  interface ComponentTypes {
    MoveToAlignmentPostDropdownItem: typeof MoveToAlignmentPostDropdownItemComponent
  }
}
