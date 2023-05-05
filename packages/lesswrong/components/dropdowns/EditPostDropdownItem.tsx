import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { canUserEditPostMetadata } from "../../lib/collections/posts/helpers";
import { userIsPodcaster } from "../../lib/vulcan-users";
import { userIsSharedOn } from "../../lib/collections/users/helpers";
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
    ? {
      pathname:'/editPost',
      search:`?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`,
    }
    : {
      pathname:'/collaborateOnPost',
      search:`?${qs.stringify({postId: post._id})}`,
    };

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
