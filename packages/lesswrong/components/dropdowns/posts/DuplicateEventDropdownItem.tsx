import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";

import { useCurrentUser } from "../../common/withUser";
import qs from "qs";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const DuplicateEventDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  if (!isEditor || !post.isEvent) {
    return null;
  }

  const linkUrl = `/newPost?${qs.stringify({eventForm: post.isEvent, templateId: post._id})}`;

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase("Duplicate Event")}
      to={linkUrl}
      icon="Edit"
    />
  );
}

const DuplicateEventDropdownItemComponent = registerComponent(
  "DuplicateEventDropdownItem",
  DuplicateEventDropdownItem,
);

declare global {
  interface ComponentTypes {
    DuplicateEventDropdownItem: typeof DuplicateEventDropdownItemComponent
  }
}
