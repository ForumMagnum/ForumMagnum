import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isFriendlyUI } from "../../themes/forumTheme";
import { PostsItemConfig } from "./usePostsItem";
import React, { ReactNode } from "react";

const PostsItem = ({...props }: PostsItemConfig) => {
  const Component = isFriendlyUI ? Components.EAPostsItem : Components.LWPostsItem;
  return <Component {...props}></Component>
}

const PostsItemComponent = registerComponent("PostsItem", PostsItem);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItemComponent
  }
}
