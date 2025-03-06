import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "@/components/dropdowns/DropdownItem";

const RetractCommentDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
  });

  const handleRetract = () => {
    void updateComment({
      selector: {_id: comment._id},
      data: {retracted: true},
    });
  }

  const handleUnretract = () => {
    void updateComment({
      selector: {_id: comment._id},
      data: {retracted: false},
    });
  }

  if (!currentUser || comment.userId !== currentUser._id) {
    return null;
  }
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

export default RetractCommentDropdownItemComponent;
