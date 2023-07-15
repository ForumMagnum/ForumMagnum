import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const RetractCommentDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const updateComment = useUpdateComment();

  const handleRetract = () => {
    void updateComment(comment._id, {retracted: true});
  }

  const handleUnretract = () => {
    void updateComment(comment._id, {retracted: false});
  }

  if (!currentUser || comment.userId !== currentUser._id) {
    return null;
  }

  const {DropdownItem} = Components;
  if (comment.retracted) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Unretract Comment")}
        onClick={handleUnretract}
        tooltip="Comment will be un-crossed-out, indicating you endorse it again."
      />
    );
  }

  return (
    <DropdownItem
      title={preferredHeadingCase("Retract Comment")}
      onClick={handleRetract}
      tooltip="Comment will become crossed out, indicating you no longer endorse it."
    />
  );
}

const RetractCommentDropdownItemComponent = registerComponent(
  'RetractCommentDropdownItem', RetractCommentDropdownItem,
);

declare global {
  interface ComponentTypes {
    RetractCommentDropdownItem: typeof RetractCommentDropdownItemComponent
  }
}
