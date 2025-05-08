import React, { useCallback } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { useCurrentUser } from "../../common/withUser";

import { userCanDo, userOwns } from "../../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import { DropdownItem } from "../DropdownItem";

const ShortformFrontpageDropdownItemInner = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });

  const handleChange = useCallback(
    (value: boolean) => () => {
      void updateComment({
        selector: {_id: comment._id},
        data: {shortformFrontpage: value},
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

export const ShortformFrontpageDropdownItem = registerComponent(
  "ShortformFrontpageDropdownItem", ShortformFrontpageDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    ShortformFrontpageDropdownItem: typeof ShortformFrontpageDropdownItem;
  }
}
