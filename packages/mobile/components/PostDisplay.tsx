import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import type { PostWithContent } from "../types/PostTypes";
import Type from "./Type";
import HtmlContentBody from "./HtmlContentBody";

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: "100%",
    padding: 10,
  },
});

const PostDisplay: FC<{post: PostWithContent}> = ({post}) => {
  return (
    <View style={styles.root}>
      <Type>{post.title}</Type>
      <Type>{post.user.username}</Type>
      <HtmlContentBody html={post.htmlBody} />
    </View>
  );
}

export default PostDisplay;
