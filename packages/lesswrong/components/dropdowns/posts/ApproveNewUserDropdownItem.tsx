import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { preferredHeadingCase } from "../../../lib/forumTypeUtils";
import { useCurrentUser } from "../../common/withUser";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { userCanDo } from "../../../lib/vulcan-users";

const ApproveNewUserDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });

  if (!post.authorIsUnreviewed || !userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  // TODO refactor this so it shares code with ModeratorActions and doens't
  // get out of sync
  const handleApproveUser = async () => {
    await updateUser({
      selector: {_id: post.userId},
      data: {
        reviewedByUserId: currentUser?._id,
        sunshineFlagged: false,
        reviewedAt: new Date(),
        needsReview: false,
        snoozedUntilContentCount: null,
      },
    });
  }

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase("Approve New User")}
      onClick={handleApproveUser}
    />
  );
}

const ApproveNewUserDropdownItemComponent = registerComponent(
  "ApproveNewUserDropdownItem",
  ApproveNewUserDropdownItem,
);

declare global {
  interface ComponentTypes {
    ApproveNewUserDropdownItem: typeof ApproveNewUserDropdownItemComponent
  }
}
