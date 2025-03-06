import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { EAPostsItemProps } from "./EAPostsItem";
import type { PostsList2Props } from "./LWPostsItem";
import LWPostsItem from "@/components/posts/LWPostsItem";
import EAPostsItem from "@/components/posts/EAPostsItem";

const PostsItem = (props: EAPostsItemProps | PostsList2Props) => {
  return isFriendlyUI ? <EAPostsItem {...props} /> : <LWPostsItem {...props} />;
};

const PostsItemComponent = registerComponent("PostsItem", PostsItem);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItemComponent
  }
}

export default PostsItemComponent;
