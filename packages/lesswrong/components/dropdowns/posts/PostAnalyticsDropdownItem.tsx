import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { canUserEditPostMetadata } from "../../../lib/collections/posts/helpers";
import { useCurrentUser } from "../../common/withUser";
import { isEAForum } from "../../../lib/instanceSettings";
import qs from "qs";

const PostAnalyticsDropdownItemInner = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const isEditor = canUserEditPostMetadata(currentUser, post);
  if (!isEAForum || !isEditor) {
    return null;
  }

  const link = `/postAnalytics?${qs.stringify({postId: post._id})}`;

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title="Analytics"
      to={link}
      icon="Analytics"
    />
  );
}

export const PostAnalyticsDropdownItem = registerComponent(
  "PostAnalyticsDropdownItem",
  PostAnalyticsDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    PostAnalyticsDropdownItem: typeof PostAnalyticsDropdownItem
  }
}
