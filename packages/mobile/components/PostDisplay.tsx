import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import type { PostWithContent } from "../types/PostTypes";
import { palette } from "../palette";
import Type from "./Type";
import HtmlContentBody from "./HtmlContentBody";
import moment from "moment";
import MobileIcon from "./MobileIcon";

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 768,
    padding: 10,
  },
  title: {
    fontFamily: palette.fonts.sans.bold,
    fontSize: 22,
    marginTop: 10,
    marginBottom: 16,
  },
  authorContainer: {
    fontSize: 16,
  },
  author: {
    fontFamily: palette.fonts.sans.semiBold,
  },
  infoRow: {
    flexDirection: "row",
    gap: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.grey[300],
  },
  secondaryText: {
    color: palette.grey[600],
    fontSize: 16,
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});

const formatDate = (date: string): string => {
  const momentDate = moment(date);
  const now = moment();
  const format = now.isSame(momentDate, "year") ? "MMM D" : "MMM D YYYY";
  return momentDate.format(format);
}

const PostDisplay: FC<{post: PostWithContent}> = ({post}) => {
  return (
    <View style={styles.root}>
      <Type style={styles.title}>
        {post.title}
      </Type>
      <Type style={styles.authorContainer}>
        by <Type style={styles.author}>{post.user.username}</Type>
      </Type>
      <View style={styles.infoRow}>
        <Type style={styles.secondaryText}>
          {formatDate(post.postedAt)}
        </Type>
        <Type style={styles.secondaryText}>
          {post.readTimeMinutes ?? 1} min read
        </Type>
        <View style={styles.commentContainer}>
          <MobileIcon icon="Comment" size={20} color={palette.grey[600]} />
          <Type style={styles.secondaryText}>
            {post.commentCount ?? 0}
          </Type>
        </View>
      </View>
      <HtmlContentBody html={post.htmlBody} />
    </View>
  );
}

export default PostDisplay;
