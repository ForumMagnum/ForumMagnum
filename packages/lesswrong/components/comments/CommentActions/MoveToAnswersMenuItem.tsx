import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo, userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { withApollo } from '@apollo/client/react/hoc';

const MoveToAnswersMenuItem = ({comment, post, client}: {
  comment: CommentsList,
  post: PostsBase,
  client?: any, //From withApollo
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  
  const handleMoveToAnswers = async () => {
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: true,
      },
    })
    flash("Comment moved to the Answers section.")
    client.resetStore()
  }

  const handleMoveToComments = async () => {
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: false,
      },
    })
    flash("Answer moved to the Comments section.")
    client.resetStore()
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
  'MoveToAnswersMenuItem', MoveToAnswersMenuItem, {
    hocs: [withApollo]
  }
);

declare global {
  interface ComponentTypes {
    MoveToAnswersMenuItem: typeof MoveToAnswersMenuItemComponent
  }
}
