import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";
import { userIsPodcaster } from "../../../lib/vulcan-users";
import { userIsSharedOn } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import qs from "qs";

const EditPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  const isPodcaster = userIsPodcaster(currentUser);
  const isShared = userIsSharedOn(currentUser, post);
  if (!isEditor && !isPodcaster && !isShared) {
    return null;
  }

  const link = (isEditor || isPodcaster)
    ? `/editPost?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`
    : `/collaborateOnPost?${qs.stringify({postId: post._id})}`;

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title="Edit"
      to={link}
      icon="Edit"
    />
  );
}

const EditPostDropdownItemComponent = registerComponent(
  "EditPostDropdownItem",
  EditPostDropdownItem,
);

declare global {
  interface ComponentTypes {
    EditPostDropdownItem: typeof EditPostDropdownItemComponent
  }
}
