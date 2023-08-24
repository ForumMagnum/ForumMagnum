import React, { FC } from "react";
import { StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSingle } from "../hooks/useSingle";
import { useMulti } from "../hooks/useMulti";
import { postWithContentSchema } from "../types/PostTypes";
import { commentSchema } from "../types/CommentTypes";
import type { RootStackParamList } from "../hooks/useNavigation";
import FullScreenScrollView from "../components/FullScreenScrollView";
import Loader from "../components/Loader";
import PostDisplay from "../components/PostDisplay";
import CommentsSection from "../components/CommentsSection";
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

  const {result: post, loading: postLoading} = useSingle({
    selector: {
      _id: params.postId,
    },
    schema: postWithContentSchema,
  });

  const {results: comments, loading: commentsLoading} = useMulti({
    terms: {
      postId: params.postId,
      view: "postCommentsMagic",
      limit: 1000,
    },
    schema: commentSchema,
  });

  return (
    <FullScreenScrollView style={styles.root}>
      {postLoading || !post
        ? <Loader />
        : (
          <>
            <PostDisplay post={post} />
            {commentsLoading
              ? <Loader />
              : <CommentsSection comments={comments ?? []} />
            }
          </>
        )
      }
    </FullScreenScrollView>
  );
}

export default PostScreen;
