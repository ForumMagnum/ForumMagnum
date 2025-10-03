import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListUpdateMutation = gql(`
  mutation updateCommentToggleIsModeratorCommentDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const ToggleIsModeratorCommentDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const [updateComment] = useMutation(CommentsListUpdateMutation);

  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) {
    return null;
  }

  const handleMarkAsModeratorComment = (modHatVisibility?: {
    hideModeratorHat: boolean,
  }) => () => {
    void updateComment({
      variables: {
        selector: { _id: comment._id },
        data: { moderatorHat: true, ...modHatVisibility }
      }
    });
  }
  const handleUnmarkAsModeratorComment = () => {
    void updateComment({
      variables: {
        selector: { _id: comment._id },
        data: { moderatorHat: false }
      }
    });
  }
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

export default registerComponent(
  "ToggleIsModeratorCommentDropdownItem", ToggleIsModeratorCommentDropdownItem,
);


