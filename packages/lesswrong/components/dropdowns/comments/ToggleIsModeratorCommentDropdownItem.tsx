import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../../themes/forumTheme';


const ToggleIsModeratorCommentDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });

  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) {
    return null;
  }

  const handleMarkAsModeratorComment = (modHatVisibility?: {
    hideModeratorHat: boolean,
  }) => () => {
    void updateComment({
      selector: { _id: comment._id },
      data: {moderatorHat: true, ...modHatVisibility},
    });
  }
  const handleUnmarkAsModeratorComment = () => {
    void updateComment({
      selector: { _id: comment._id },
      data: {moderatorHat: false},
    });
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
