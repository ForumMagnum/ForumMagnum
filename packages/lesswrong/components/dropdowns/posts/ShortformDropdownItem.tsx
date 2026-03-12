import React from "react";
import { useCurrentUser } from "../../common/withUser";
import { userCanDo } from "../../../lib/vulcan-users/permissions";
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

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

  const contentType = "Quick Takes";
  return (
    <DropdownItem
      title={`Set as user's ${contentType} Post`}
      onClick={handleMakeShortform}
    />
  );
}

export default ShortformDropdownItem;
