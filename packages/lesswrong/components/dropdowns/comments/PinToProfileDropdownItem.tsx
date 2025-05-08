import React, { useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { DropdownItem } from "../DropdownItem";

const styles = (_: ThemeType) => ({
  icon: isFriendlyUI
    ? {fontSize: "18px"}
    : {},
});

const PinToProfileDropdownItemInner = ({comment, post, classes}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  const togglePinned = useCallback(() => {
    void updateComment({
      selector: {_id: comment._id},
      data: {
        isPinnedOnProfile: !comment.isPinnedOnProfile,
      },
    });
  }, [updateComment, comment]);

  const isCommentAuthor = currentUser?._id === comment.userId
  const userCanPin = isCommentAuthor || currentUser?.isAdmin;
  if (!userCanPin || !post) {
    return null;
  }

  const username = isCommentAuthor
    ? isFriendlyUI ? "your" : "my"
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

export const PinToProfileDropdownItem = registerComponent(
  "PinToProfileDropdownItem",
  PinToProfileDropdownItemInner,
  {styles},
);


declare global {
  interface ComponentTypes {
    PinToProfileDropdownItem: typeof PinToProfileDropdownItem
  }
}
