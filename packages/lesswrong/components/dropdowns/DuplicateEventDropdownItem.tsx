import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { canUserEditPostMetadata } from "../../lib/collections/posts/helpers";
import { preferredHeadingCase } from "../../lib/forumTypeUtils";
import { useCurrentUser } from "../common/withUser";
import qs from "qs";

const DuplicateEventDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  if (!isEditor || !post.isEvent) {
    return null;
  }

  const link = {
    pathname:'/newPost',
    search:`?${qs.stringify({eventForm: post.isEvent, templateId: post._id})}`,
  };

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase("Duplicate Event")}
      to={link}
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
