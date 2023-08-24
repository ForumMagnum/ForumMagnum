import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import type { Post } from "../types/PostTypes";
import PostItem from "./PostItem";

const styles = StyleSheet.create({
  container: {
    maxWidth: 768,
    width: "100%",
  },
});

const PostsList: FC<{posts: Post[]}> = ({posts}) => {
  return (
    <View style={styles.container}>
      {posts.map(((post) =>
        <PostItem key={post._id} post={post} />
      ))}
    </View>
  );
}

export default PostsList;
