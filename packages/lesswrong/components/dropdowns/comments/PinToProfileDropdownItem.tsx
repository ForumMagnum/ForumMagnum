import React, { useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListUpdateMutation = gql(`
  mutation updateCommentPinToProfileDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  icon: theme.isFriendlyUI
    ? {fontSize: "18px"}
    : {},
});

const PinToProfileDropdownItem = ({comment, post, classes}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const [updateComment] = useMutation(CommentsListUpdateMutation);
  const togglePinned = useCallback(() => {
    void updateComment({
      variables: {
        selector: { _id: comment._id },
        data: {
          isPinnedOnProfile: !comment.isPinnedOnProfile,
        }
      }
    });
  }, [updateComment, comment]);

  const isCommentAuthor = currentUser?._id === comment.userId
  const userCanPin = isCommentAuthor || currentUser?.isAdmin;
  if (!userCanPin || !post) {
    return null;
  }

  const username = isCommentAuthor
    ? isFriendlyUI() ? "your" : "my"
    : `${comment.user?.displayName}'s`;

  const title = comment.isPinnedOnProfile
    ? `Unpin from ${username} profile`
    : `Pin to ${username} profile`;
  return (
    <DropdownItem
      title={title}
      onClick={togglePinned}
      icon="Pin"
    />
  );
};

export default registerComponent(
  "PinToProfileDropdownItem",
  PinToProfileDropdownItem,
  {styles},
);



