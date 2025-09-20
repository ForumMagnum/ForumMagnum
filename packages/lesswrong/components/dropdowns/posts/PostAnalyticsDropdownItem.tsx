import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";
import { useCurrentUser } from "../../common/withUser";
import { isEAForum } from "../../../lib/instanceSettings";
import qs from "qs";
import DropdownItem from "../DropdownItem";

const PostAnalyticsDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  if (!isEAForum() || !isEditor) {
    return null;
  }

  const link = `/postAnalytics?${qs.stringify({postId: post._id})}`;
  return (
    <DropdownItem
      title="Analytics"
      to={link}
      icon="Analytics"
    />
  );
}

export default registerComponent(
  "PostAnalyticsDropdownItem",
  PostAnalyticsDropdownItem,
);


