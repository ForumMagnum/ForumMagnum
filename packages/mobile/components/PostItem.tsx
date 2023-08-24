import React, { FC, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "../navigation";
import { useFormattedDate } from "../hooks/useFormattedDate";
import { Path, Svg } from "react-native-svg";
import { palette } from "../palette";
import type { Post } from "../types/PostTypes";
import Type from "./Type";
import MobileIcon from "./MobileIcon";
import Touchable from "./Touchable";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: palette.grey[0],
    borderWidth: 1,
    borderColor: palette.grey[100],
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
    flexDirection: "column",
    gap: 4,
    width: 26,
    alignItems: "center",
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
  const formattedDate = useFormattedDate(post.postedAt, "fromNow");
  const navigation = useNavigation();
  const onPress = useCallback(() => {
    navigation.navigate("Post", {
      postId: post._id,
      title: post.title,
    });
  }, [navigation, post._id, post.title]);
  return (
    <Touchable
      onPress={onPress}
    >
      <View style={styles.root}>
        <View style={styles.karma}>
          <Svg width="9" height="6" viewBox="0 0 9 6" fill={palette.grey[600]}>
            <Path d="M4.11427 0.967669C4.31426 0.725192 4.68574 0.725192 4.88573 0.967669L8.15534 4.93186C8.42431 5.25798 8.19234 5.75 7.76961 5.75H1.23039C0.807659 5.75 0.575686 5.25798 0.844665 4.93186L4.11427 0.967669Z" />
          </Svg>
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
              <Type style={styles.secondaryText}>·</Type>
              <Type style={[styles.secondaryText, styles.grow]}>
                {formattedDate}
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
    </Touchable>
  );
}

export default PostItem;
