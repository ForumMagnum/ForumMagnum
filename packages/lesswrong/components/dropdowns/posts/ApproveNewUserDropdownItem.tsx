import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";

import { useCurrentUser } from "../../common/withUser";
import { userCanDo } from "../../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersCurrentUpdateMutation = gql(`
  mutation updateUserApproveNewUserDropdownItem($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersCurrent
      }
    }
  }
`);

const ApproveNewUserDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const [updateUser] = useMutation(UsersCurrentUpdateMutation);

  if (!post.authorIsUnreviewed || !userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  // TODO refactor this so it shares code with ModeratorActions and doesn't
  // get out of sync
  const handleApproveUser = async () => {
    await updateUser({
      variables: {
        selector: { _id: post.userId },
        data: {
          reviewedByUserId: currentUser?._id,
          sunshineFlagged: false,
          reviewedAt: new Date(),
          needsReview: false,
          snoozedUntilContentCount: null,
        }
      }
    });
  }
  return (
    <DropdownItem
      title={preferredHeadingCase("Approve New User")}
      onClick={handleApproveUser}
    />
  );
}

export default registerComponent(
  "ApproveNewUserDropdownItem",
  ApproveNewUserDropdownItem,
);


