import React, { PureComponent } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { withUpdate } from '../../../lib/crud/withUpdate';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import Users from '../../../lib/collections/users/collection';
import { Comments } from "../../../lib/collections/comments";
import withUser from '../../common/withUser';
import { withApollo } from '@apollo/client/react/hoc';

interface ExternalProps {
  comment: CommentsList,
  post: PostsBase,
}
interface MoveToAnswersMenuItemProps extends ExternalProps, WithMessagesProps, WithUserProps, WithUpdateCommentProps, WithApolloProps {
}
class MoveToAnswersMenuItem extends PureComponent<MoveToAnswersMenuItemProps,{}> {

  handleMoveToAnswers = async () => {
    const { comment, updateComment, client, flash } = this.props
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: true,
      },
    })
    flash("Comment moved to the Answers section.")
    client.resetStore()
  }

  handleMoveToComments = async () => {
    const { comment, updateComment, client, flash } = this.props
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: false,
      },
    })
    flash("Answer moved to the Comments section.")
    client.resetStore()
  }

  render() {
    const { currentUser, comment, post } = this.props
    if (!comment.topLevelCommentId && post.question &&
        (Users.canDo(currentUser, "comments.edit.all") || Users.owns(currentUser, comment))) {

        if (comment.answer) {
          return (
            <MenuItem onClick={this.handleMoveToComments}>
              Move To Comments
            </MenuItem>
          )
        } else {
          return (
            <MenuItem onClick={this.handleMoveToAnswers}>
              Move To Answers
            </MenuItem>
          )
        }
    } else {
      return null
    }
  }
}

const MoveToAnswersMenuItemComponent = registerComponent<ExternalProps>(
  'MoveToAnswersMenuItem', MoveToAnswersMenuItem, {
    hocs: [
      withUser, withApollo, withMessages,
      withUpdate({
        collection: Comments,
        fragmentName: 'CommentsList',
      }),
    ]
  }
);

declare global {
  interface ComponentTypes {
    MoveToAnswersMenuItem: typeof MoveToAnswersMenuItemComponent
  }
}
