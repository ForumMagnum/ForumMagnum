import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";

import { useCurrentUser } from "../../common/withUser";
import { userCanDo } from "../../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersCurrentUpdateMutation = gql(`
  mutation updateUserShortformDropdownItem($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersCurrent
      }
    }
  }
`);

const ShortformDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const [updateUser] = useMutation(UsersCurrentUpdateMutation);

  if (post.shortform || !userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  const handleMakeShortform = () => {
    void updateUser({
      variables: {
        selector: { _id: post.userId },
        data: {
          shortformFeedId: post._id,
        }
      }
    });
  }

  const contentType = preferredHeadingCase("Quick Takes");
  return (
    <DropdownItem
      title={preferredHeadingCase(`Set as user's ${contentType} Post`)}
      onClick={handleMakeShortform}
    />
  );
}

export default registerComponent(
  "ShortformDropdownItem",
  ShortformDropdownItem,
);


