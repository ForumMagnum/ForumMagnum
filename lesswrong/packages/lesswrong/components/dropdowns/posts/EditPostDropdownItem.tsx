import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";
import { userIsPodcaster } from "../../../lib/vulcan-users/permissions";
import { userIsSharedOn } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import qs from "qs";
import DropdownItem from "@/components/dropdowns/DropdownItem";

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

export default EditPostDropdownItemComponent;
