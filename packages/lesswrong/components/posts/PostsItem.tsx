import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { EAPostsItemProps } from "./EAPostsItem";
import type { PostsList2Props } from "./LWPostsItem";

const PostsItemInner = (props: EAPostsItemProps | PostsList2Props) => {
  return isFriendlyUI ? <Components.EAPostsItem {...props} /> : <Components.LWPostsItem {...props} />;
};

export const PostsItem = registerComponent("PostsItem", PostsItemInner);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItem
  }
}
