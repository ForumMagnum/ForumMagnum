import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const ToggleIsModeratorCommentDropdownItem = ({comment, insertModeratorCommentInDialogue}: {
  comment: CommentsList,
  insertModeratorCommentInDialogue?: ()=>void,
}) => {
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
  const buttons: React.ReactNode[] = [];

  if (insertModeratorCommentInDialogue) {
    buttons.push(<DropdownItem
      title={preferredHeadingCase("Insert Moderator Comment Above")}
      onClick={insertModeratorCommentInDialogue}
    />);
  }
  
  if (comment.moderatorHat) {
    buttons.push(<DropdownItem
      title={preferredHeadingCase("Un-mark as Moderator Comment")}
      onClick={handleUnmarkAsModeratorComment}
    />);
  } else {
    buttons.push(<DropdownItem
      title={preferredHeadingCase("Mark as Moderator Comment (visible)")}
      onClick={handleMarkAsModeratorComment()}
    />);
    buttons.push(<DropdownItem
      title={preferredHeadingCase("Mark as Moderator Comment (invisible)")}
      onClick={handleMarkAsModeratorComment({ hideModeratorHat: true })}
    />);
  }
  
  return <>{buttons}</>;
}

const ToggleIsModeratorCommentDropdownItemComponent = registerComponent(
  "ToggleIsModeratorCommentDropdownItem", ToggleIsModeratorCommentDropdownItem,
);

declare global {
  interface ComponentTypes {
    ToggleIsModeratorCommentDropdownItem: typeof ToggleIsModeratorCommentDropdownItemComponent
  }
}
