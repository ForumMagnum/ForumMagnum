import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { EAPostsItemProps, EAPostsItem } from "./EAPostsItem";
import type { PostsList2Props, LWPostsItem } from "./LWPostsItem";

const PostsItemInner = (props: EAPostsItemProps | PostsList2Props) => {
  return isFriendlyUI ? <EAPostsItem {...props} /> : <LWPostsItem {...props} />;
};

export const PostsItem = registerComponent("PostsItem", PostsItemInner);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItem
  }
}
