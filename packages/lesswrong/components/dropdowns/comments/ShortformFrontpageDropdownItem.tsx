import React, { useCallback } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useCurrentUser } from "../../common/withUser";

import { userCanDo, userOwns } from "../../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const CommentsListUpdateMutation = gql(`
  mutation updateCommentShortformFrontpageDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const ShortformFrontpageDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const [updateComment] = useMutation(CommentsListUpdateMutation);

  const handleChange = useCallback(
    (value: boolean) => () => {
      void updateComment({
        variables: {
          selector: { _id: comment._id },
          data: { shortformFrontpage: value }
        }
      });
    },
    [updateComment, comment._id],
  );

  if (
    !comment.shortform ||
    !currentUser ||
    !(userCanDo(currentUser, "comments.edit.all") || userOwns(currentUser, comment))
  ) {
    return null;
  }

  const title = comment.shortformFrontpage
    ? "Remove from Frontpage"
    : "Allow on Frontpage";
  return (
    <DropdownItem
      title={preferredHeadingCase(title)}
      onClick={handleChange(!comment.shortformFrontpage)}
    />
  );
};

export default registerComponent(
  "ShortformFrontpageDropdownItem", ShortformFrontpageDropdownItem,
);


