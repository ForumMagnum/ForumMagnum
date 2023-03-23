import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useMessages } from '../../common/withMessages';
import { userCanDo, userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useApolloClient } from '@apollo/client/react/hooks';

const MoveToAnswersMenuItem = ({comment, post}: {
  comment: CommentsList,
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const client = useApolloClient();
  const { MenuItem } = Components;

  const updateComment = useUpdateComment();
  
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

  if (!comment.topLevelCommentId && post.question &&
    (userCanDo(currentUser, "comments.edit.all") || userOwns(currentUser, comment)))
  {
    if (comment.answer) {
      return (
        <MenuItem onClick={handleMoveToComments}>
          Move To Comments
        </MenuItem>
      )
    } else {
      return (
        <MenuItem onClick={handleMoveToAnswers}>
          Move To Answers
        </MenuItem>
      )
    }
  } else {
    return null
  }
}

const MoveToAnswersMenuItemComponent = registerComponent(
  'MoveToAnswersMenuItem', MoveToAnswersMenuItem);

declare global {
  interface ComponentTypes {
    MoveToAnswersMenuItem: typeof MoveToAnswersMenuItemComponent
  }
}
