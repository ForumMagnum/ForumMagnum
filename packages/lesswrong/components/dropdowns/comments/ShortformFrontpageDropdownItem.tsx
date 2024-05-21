import React, { useCallback } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { useCurrentUser } from "../../common/withUser";

import { userCanDo, userOwns } from "../../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const ShortformFrontpageDropdownItem = ({comment}: {comment: CommentsList}) => {
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
