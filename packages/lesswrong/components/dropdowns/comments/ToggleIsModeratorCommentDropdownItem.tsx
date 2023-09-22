import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const ToggleIsModeratorCommentDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const updateComment = useUpdateComment();

  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) {
    return null;
  }

  const handleMarkAsModeratorComment = (modHatVisibility?: {
    hideModeratorHat: boolean,
  }) => () => {
    void updateComment(comment._id, {moderatorHat: true, ...modHatVisibility})
  }
  const handleUnmarkAsModeratorComment = () => {
    void updateComment(comment._id, {moderatorHat: false});
  }

  const {DropdownItem} = Components;
  if (comment.moderatorHat) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Un-mark as Moderator Comment")}
        onClick={handleUnmarkAsModeratorComment}
      />
    );
  }

  return (
    <>
      <DropdownItem
        title={preferredHeadingCase("Mark as Moderator Comment (visible)")}
        onClick={handleMarkAsModeratorComment()}
      />
      <DropdownItem
        title={preferredHeadingCase("Mark as Moderator Comment (invisible)")}
        onClick={handleMarkAsModeratorComment({ hideModeratorHat: true })}
      />
    </>
  );
}

const ToggleIsModeratorCommentDropdownItemComponent = registerComponent(
  "ToggleIsModeratorCommentDropdownItem", ToggleIsModeratorCommentDropdownItem,
);

declare global {
  interface ComponentTypes {
    ToggleIsModeratorCommentDropdownItem: typeof ToggleIsModeratorCommentDropdownItemComponent
  }
}
