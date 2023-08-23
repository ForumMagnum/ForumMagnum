import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import { palette } from "./palette";
import Type from "./components/Type";
import moment from "moment";

type Post = {
  _id: string,
  title: string,
  slug: string,
  pageUrl: string,
  postedAt: string,
  curatedAt?: string,
  baseScore: number,
  commentCount?: number,
  question: boolean,
  url?: string,
  user: {
    username: string,
    slug: string,
  },
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: palette.grey[0],
    border: `1px solid ${palette.grey[100]}`,
    borderRadius: palette.borderRadius,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  row: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
    gap: 4,
  },
  grow: {
    flexGrow: 1,
  },
  title: {
    fontFamily: palette.fonts.sans.semiBold,
  },
  secondaryText: {
    color: palette.grey[600],
    fontSize: 13,
  },
});

const PostItem: FC<{post: Post}> = ({post}) => {
  return (
    <View style={styles.root}>
      <View>
        <Type style={styles.secondaryText}>
          {post.baseScore}
        </Type>
      </View>
      <View style={[styles.grow, styles.column]}>
        <Type style={styles.title}>{post.title}</Type>
        <View style={styles.row}>
          <View style={[styles.row, styles.grow]}>
            <Type style={styles.secondaryText}>
              {post.user.username}
            </Type>
            <Type style={styles.secondaryText}> · </Type>
            <Type style={[styles.secondaryText, styles.grow]}>
              {moment(new Date(post.postedAt)).fromNow()}
            </Type>
          </View>
          <Type style={styles.secondaryText}>
            {post.commentCount ?? 0}
          </Type>
        </View>
      </View>
    </View>
  );
}

export default PostItem;
