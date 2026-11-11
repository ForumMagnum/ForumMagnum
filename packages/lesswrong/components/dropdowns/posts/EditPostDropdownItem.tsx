import React from "react";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";
import { userIsSharedOn } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import qs from "qs";
import DropdownItem from "../DropdownItem";

const EditPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  const isShared = userIsSharedOn(currentUser, post);
  if (!isEditor && !isShared) {
    return null;
  }

  const link = `/editPost?${qs.stringify({postId: post._id, eventForm: post.isEvent || undefined})}`;
  return (
    <DropdownItem
      title="Edit"
      to={link}
      icon="Edit"
    />
  );
}

export default EditPostDropdownItem;


