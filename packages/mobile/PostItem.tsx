import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import { palette } from "./palette";
import Type from "./components/Type";
import moment from "moment";
import MobileIcon from "./components/MobileIcon";

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
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: palette.grey[0],
    border: `1px solid ${palette.grey[100]}`,
    borderRadius: palette.borderRadius,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 4,
  },
  column: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },
  grow: {
    flexGrow: 1,
  },
  karma: {
    width: 24,
  },
  title: {
    fontFamily: palette.fonts.sans.semiBold,
    flexShrink: 1,
  },
  secondaryText: {
    color: palette.grey[600],
    fontSize: 13,
  },
});

const PostItem: FC<{post: Post}> = ({post}) => {
  return (
    <View style={styles.root}>
      <View style={styles.karma}>
        <Type style={styles.secondaryText}>
          {post.baseScore}
        </Type>
      </View>
      <View style={[styles.grow, styles.column]}>
        <Type style={styles.title} numberOfLines={1}>
          {post.title}
        </Type>
        <View style={[styles.flex, styles.row]}>
          <View style={[styles.row, styles.grow]}>
            <Type style={styles.secondaryText}>
              {post.user.username}
            </Type>
            <Type style={styles.secondaryText}> · </Type>
            <Type style={[styles.secondaryText, styles.grow]}>
              {moment(new Date(post.postedAt)).fromNow()}
            </Type>
          </View>
          <View style={styles.row}>
            <MobileIcon
              icon="Comment"
              size={18}
              color={palette.grey[600]}
            />
            <Type style={styles.secondaryText}>
              {post.commentCount ?? 0}
            </Type>
          </View>
        </View>
      </View>
    </View>
  );
}

export default PostItem;
