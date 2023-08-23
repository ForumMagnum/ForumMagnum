import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import { useMulti } from "../hooks/useMulti";
import Loader from "./Loader";
import PostItem from "../PostItem";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 768,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

const PostsList: FC = () => {
  const {results, loading} = useMulti();
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
