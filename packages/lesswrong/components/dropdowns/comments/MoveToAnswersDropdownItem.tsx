import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useMessages } from '../../common/withMessages';
import { userCanDo, userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useApolloClient } from '@apollo/client/react/hooks';
import { preferredHeadingCase } from '../../../themes/forumTheme';


const MoveToAnswersDropdownItemInner = ({comment, post}: {
  comment: CommentsList,
  post?: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const client = useApolloClient();

  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });

  if (
    comment.topLevelCommentId ||
    !post?.question ||
    !(userCanDo(currentUser, "comments.edit.all") || userOwns(currentUser, comment)))
  {
    return null;
  }

  const handleMoveToAnswers = async () => {
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: true,
      },
    })
    flash("Comment moved to the Answers section.")
    await client.resetStore()
  }

  const handleMoveToComments = async () => {
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: false,
      },
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

export const MoveToAnswersDropdownItem = registerComponent(
  'MoveToAnswersDropdownItem', MoveToAnswersDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    MoveToAnswersDropdownItem: typeof MoveToAnswersDropdownItem
  }
}
