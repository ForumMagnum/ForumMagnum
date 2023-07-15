import React, { useCallback } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { useUpdateComment } from "../../hooks/useUpdateComment";
import { useCurrentUser } from "../../common/withUser";
import { preferredHeadingCase } from "../../../lib/forumTypeUtils";
import { userCanDo, userOwns } from "../../../lib/vulcan-users/permissions";

const ShortformFrontpageDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const updateComment = useUpdateComment();

  const handleChange = useCallback(
    (value: boolean) => () => {
      void updateComment(comment._id, {shortformFrontpage: value});
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

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase(title)}
      onClick={handleChange(!comment.shortformFrontpage)}
    />
  );
};

const ShortformFrontpageDropdownItemComponent = registerComponent(
  "ShortformFrontpageDropdownItem", ShortformFrontpageDropdownItem,
);

declare global {
  interface ComponentTypes {
    ShortformFrontpageDropdownItem: typeof ShortformFrontpageDropdownItemComponent;
  }
}
