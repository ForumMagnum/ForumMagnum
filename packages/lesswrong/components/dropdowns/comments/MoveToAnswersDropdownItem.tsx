import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useMessages } from '../../common/withMessages';
import { userCanDo, userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useApolloClient } from '@apollo/client/react/hooks';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListUpdateMutation = gql(`
  mutation updateCommentMoveToAnswersDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const MoveToAnswersDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const client = useApolloClient();

  const [updateComment] = useMutation(CommentsListUpdateMutation);

  if (
    comment.topLevelCommentId ||
    !post?.question ||
    !(userCanDo(currentUser, "comments.edit.all") || userOwns(currentUser, comment)))
  {
    return null;
  }

  const handleMoveToAnswers = async () => {
    await updateComment({
      variables: {
        selector: { _id: comment._id },
        data: {
          answer: true,
        }
      }
    })
    flash("Comment moved to the Answers section.")
    await client.resetStore()
  }

  const handleMoveToComments = async () => {
    await updateComment({
      variables: {
        selector: { _id: comment._id },
        data: {
          answer: false,
        }
      }
    })
    flash("Answer moved to the Comments section.")
    await client.resetStore()
  }
  if (comment.answer) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Move To Comments")}
        onClick={handleMoveToComments}
      />
    );
  }

  return (
    <DropdownItem
      title={preferredHeadingCase("Move To Answers")}
      onClick={handleMoveToAnswers}
    />
  );
}

export default registerComponent(
  'MoveToAnswersDropdownItem', MoveToAnswersDropdownItem,
);


