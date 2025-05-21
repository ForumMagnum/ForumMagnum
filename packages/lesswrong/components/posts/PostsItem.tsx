import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import EAPostsItem, { EAPostsItemProps } from "./EAPostsItem";
import LWPostsItem, { PostsList2Props } from "./LWPostsItem";

const PostsItem = (props: EAPostsItemProps | PostsList2Props) => {
  return isFriendlyUI ? <EAPostsItem {...props} /> : <LWPostsItem {...props} />;
};

export default registerComponent("PostsItem", PostsItem);


