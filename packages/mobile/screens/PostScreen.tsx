import React, { FC } from "react";
import { StyleSheet } from "react-native";
import { useSingle } from "../hooks/useSingle";
import FullScreenScrollView from "../components/FullScreenScrollView";
import Loader from "../components/Loader";
import PostDisplay from "../components/PostDisplay";
import { postWithContentSchema } from "../types/PostTypes";
import { useRoute } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation";
import { palette } from "../palette";

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.grey[0],
    minHeight: "100%",
  },
});

const PostScreen: FC = () => {
  const route = useRoute();
  const params = route.params as RootStackParamList["Post"];
  const {result, loading} = useSingle({
    selector: {
      _id: params.postId,
    },
    schema: postWithContentSchema,
  });
  return (
    <FullScreenScrollView style={styles.root}>
      {loading ? <Loader /> : <PostDisplay post={result} />}
    </FullScreenScrollView>
  );
}

export default PostScreen;
