import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";

import { useCurrentUser } from "../../common/withUser";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { userCanDo } from "../../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const ShortformDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });

  if (post.shortform || !userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  const handleMakeShortform = () => {
    void updateUser({
      selector: {_id: post.userId},
      data: {
        shortformFeedId: post._id,
      },
    });
  }

  const contentType = preferredHeadingCase("Quick Takes");

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase(`Set as user's ${contentType} Post`)}
      onClick={handleMakeShortform}
    />
  );
}

const ShortformDropdownItemComponent = registerComponent(
  "ShortformDropdownItem",
  ShortformDropdownItem,
);

declare global {
  interface ComponentTypes {
    ShortformDropdownItem: typeof ShortformDropdownItemComponent
  }
}
