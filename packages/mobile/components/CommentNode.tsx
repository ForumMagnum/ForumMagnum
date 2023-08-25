import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import type { DisplayComment } from "../hooks/useDisplayComments";
import { useFormattedDate } from "../hooks/useFormattedDate";
import Type from "./Type";
import HtmlContentBody from "./HtmlContentBody";
import { palette } from "../palette";

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: palette.commentBorder,
    borderRadius: palette.borderRadiusSmall,
    padding: 14,
    paddingBottom: 0,
    marginBottom: 8,
    backgroundColor: palette.grey[0],
  },
  rootOdd: {
    backgroundColor: palette.grey[120],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    borderBottom: 8,
  },
  author: {
    fontFamily: palette.fonts.sans.semiBold,
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: palette.grey[600],
  },
});

const CommentNode: FC<{
  comment: DisplayComment,
  depth?: number,
}> = ({
  comment: {comment, children},
  depth = 0,
}) => {
  const formattedDate = useFormattedDate(comment.postedAt, "fromNow");
  return (
    <View style={[styles.root, depth & 1 ? styles.rootOdd : undefined]}>
      <View style={styles.metaRow}>
        <Type style={styles.author}>
          {comment.user?.username ?? "[deleted]"}
        </Type>
        <Type style={styles.metaText}>
          {formattedDate}
        </Type>
      </View>
      <HtmlContentBody html={comment.contents?.html ?? ""} sans />
      {children.length > 0 &&
        <View>
          {children.map((child) =>
            <CommentNode
              comment={child}
              depth={depth + 1}
              key={child.comment._id}
            />
          )}
        </View>
      }
    </View>
  );
}

export default CommentNode;
