import React, { FC } from "react";
import { View } from "react-native";
import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";
import type { PostWithContent } from "../types/PostTypes";
import Type from "./Type";

const PostDisplay: FC<{post: PostWithContent}> = ({post}) => {
  const {width} = useWindowDimensions();
  return (
    <View>
      <Type>{post.title}</Type>
      <Type>{post.user.username}</Type>
      <RenderHtml
        contentWidth={width}
        source={{html: post.htmlBody}}
      />
    </View>
  );
}

export default PostDisplay;
