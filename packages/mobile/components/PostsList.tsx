import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import { useMulti } from "../hooks/useMulti";
import { postSchema } from "../types/PostTypes";
import Loader from "./Loader";
import PostItem from "./PostItem";

const styles = StyleSheet.create({
  container: {
    maxWidth: 768,
    width: "100%",
  },
});

const PostsList: FC = () => {
  const {results, loading} = useMulti({
    terms: {
      view: "magic",
      limit: 20,
      meta: null,
      forum: true,
    },
    schema: postSchema,
  });
  if (loading) {
    return (
      <Loader />
    );
  }
  return (
    <View style={styles.container}>
      {results?.map(((result) => {
          return <PostItem key={result._id} post={result} />;
      }))}
    </View>
  );
}

export default PostsList;
