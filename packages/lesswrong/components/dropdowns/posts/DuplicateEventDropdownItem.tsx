import React from "react";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";

import { useCurrentUser } from "../../common/withUser";
import qs from "qs";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "../DropdownItem";

const DuplicateEventDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  if (!isEditor || !post.isEvent) {
    return null;
  }

  const linkUrl = `/newPost?${qs.stringify({eventForm: post.isEvent, templateId: post._id})}`;
  return (
    <DropdownItem
      title={preferredHeadingCase("Duplicate Event")}
      to={linkUrl}
      icon="Edit"
    />
  );
}

export default DuplicateEventDropdownItem;


