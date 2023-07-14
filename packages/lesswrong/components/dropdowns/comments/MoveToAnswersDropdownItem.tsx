import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useMessages } from '../../common/withMessages';
import { userCanDo, userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useApolloClient } from '@apollo/client/react/hooks';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const MoveToAnswersDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const client = useApolloClient();

  const updateComment = useUpdateComment();

  if (
    comment.topLevelCommentId ||
    !post?.question ||
    !(userCanDo(currentUser, "comments.edit.all") || userOwns(currentUser, comment)))
  {
    return null;
  }

  const handleMoveToAnswers = async () => {
    await updateComment(comment._id, {
      answer: true,
    });
    flash("Comment moved to the Answers section.")
    await client.resetStore()
  }

  const handleMoveToComments = async () => {
    await updateComment(comment._id, {
      answer: false,
    })
    flash("Answer moved to the Comments section.")
    await client.resetStore()
  }

  const {DropdownItem} = Components;
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

const MoveToAnswersDropdownItemComponent = registerComponent(
  'MoveToAnswersDropdownItem', MoveToAnswersDropdownItem,
);

declare global {
  interface ComponentTypes {
    MoveToAnswersDropdownItem: typeof MoveToAnswersDropdownItemComponent
  }
}
