import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import { useDisplayComments } from "../hooks/useDisplayComments";
import type { Comment } from "../types/CommentTypes";
import Type from "../components/Type";
import CommentNode from "./CommentNode";
import { palette } from "../palette";

const styles = StyleSheet.create({
  root: {
    width: "100%",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    marginBottom: 12,
  },
  headerText: {
    fontFamily: palette.fonts.sans.bold,
    fontSize: 22,
  },
  commentCount: {
    color: palette.grey[600],
    marginLeft: 8,
  },
});

const CommentsSection: FC<{comments: Comment[]}> = ({comments}) => {
  const displayComments = useDisplayComments(comments);
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Type style={styles.headerText}>
          Comments
        </Type>
        {comments.length > 0 &&
          <Type style={[styles.headerText, styles.commentCount]}>
            {comments.length}
          </Type>
        }
      </View>
      <View>
        {displayComments.map((comment) =>
          <CommentNode comment={comment} key={comment.comment._id} />
        )}
      </View>
    </View>
  );
}

export default CommentsSection;
