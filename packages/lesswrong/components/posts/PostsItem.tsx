import React, { useContext } from "react";
import LWPostsItem, { PostsList2Props } from "./LWPostsItem";
import PostsListDebugRow from "./PostsListDebugRow";
import { PostsListDebugContext } from "./postsListDebugContext";

const PostsItem = (props: PostsList2Props) => {
  const debugSettings = useContext(PostsListDebugContext);
  if (debugSettings) {
    return <PostsListDebugRow item={props} settings={debugSettings}>
      <LWPostsItem {...props} />
    </PostsListDebugRow>;
  }
  return <LWPostsItem {...props} />;
};

export default PostsItem;
