import React, { FC } from "react";
import { View } from "react-native";
import type { Post } from "../types/PostTypes";
import Type from "./Type";

const PostDisplay: FC<{post: Post}> = ({post}) => {
  return (
    <View>
      <Type>{post.title}</Type>
      <Type>{post.user.username}</Type>
    </View>
  );
}

export default PostDisplay;
