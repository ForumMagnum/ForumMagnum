import React from "react";
import LWPostsItem from "./LWPostsItem";
import { PostsItemConfig } from "./postsItemHelpers";

const PostsItem = (props: PostsItemConfig) => {
  return <LWPostsItem {...props} />;
};

export default PostsItem;


