import React, { useCallback } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useCurrentUser } from '../../common/withUser';
import { isEAForum } from '../../../lib/instanceSettings';

const styles = (_: ThemeType) => ({
  icon: isEAForum
    ? {fontSize: "18px"}
    : {},
});

const PinToProfileDropdownItem = ({comment, post, classes}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const updateComment = useUpdateComment();
  const togglePinned = useCallback(() => {
    void updateComment(comment._id, { isPinnedOnProfile: !comment.isPinnedOnProfile });
  }, [updateComment, comment]);

  const isCommentAuthor = currentUser?._id === comment.userId
  const userCanPin = isCommentAuthor || currentUser?.isAdmin;
  if (!userCanPin || !post) {
    return null;
  }

  const username = isCommentAuthor
    ? isEAForum ? "your" : "my"
    : `${comment.user?.displayName}'s`;

  const title = comment.isPinnedOnProfile
    ? `Unpin from ${username} profile`
    : `Pin to ${username} profile`;

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={title}
      onClick={togglePinned}
      icon="Pin"
    />
  );
};

const PinToProfileDropdownItemComponent = registerComponent(
  "PinToProfileDropdownItem",
  PinToProfileDropdownItem,
  {styles},
);


declare global {
  interface ComponentTypes {
    PinToProfileDropdownItem: typeof PinToProfileDropdownItemComponent
  }
}
