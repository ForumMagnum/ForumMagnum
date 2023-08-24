import React, { FC } from "react";
import { View } from "react-native";
import type { DisplayComment } from "../hooks/useDisplayComments";
import Type from "./Type";

const CommentNode: FC<{comment: DisplayComment}> = ({comment}) => {
  return (
    <View>
      <Type>{comment.comment.user.username}</Type>
    </View>
  );
}

export default CommentNode;
