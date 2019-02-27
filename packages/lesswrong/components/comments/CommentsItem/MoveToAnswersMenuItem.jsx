import React, { PureComponent } from 'react';
import { registerComponent, withUpdate, withMessages } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Comments } from "../../../lib/collections/comments";
import withUser from '../../common/withUser';
import { withApollo } from 'react-apollo'

class MoveToAnswersMenuItem extends PureComponent {

  handleMoveToAnswers = async () => {
    const { comment, updateComment, client, flash } = this.props
    await updateComment({
      selector: { _id: comment._id},
      data: {
        answer: true,
      },
    })
    flash({id:"questions.comments.moved_to_answers"})
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
    flash({id:"questions.comments.moved_to_comments"})
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

MoveToAnswersMenuItem.propTypes = {
  currentUser: PropTypes.object,
  comment: PropTypes.object.isRequired
}

const withUpdateOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
}

registerComponent('MoveToAnswersMenuItem', MoveToAnswersMenuItem, withUser, [withUpdate, withUpdateOptions], withApollo, withMessages);
