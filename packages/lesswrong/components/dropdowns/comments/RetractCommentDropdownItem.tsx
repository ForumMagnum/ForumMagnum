import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListUpdateMutation = gql(`
  mutation updateCommentRetractCommentDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const RetractCommentDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const [updateComment] = useMutation(CommentsListUpdateMutation);

  const handleRetract = () => {
    void updateComment({
      variables: {
        selector: { _id: comment._id },
        data: { retracted: true }
      }
    });
  }

  const handleUnretract = () => {
    void updateComment({
      variables: {
        selector: { _id: comment._id },
        data: { retracted: false }
      }
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

export default registerComponent(
  'RetractCommentDropdownItem', RetractCommentDropdownItem,
);


