import { Components , registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';

class DeletePost extends Component {

  handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      const { currentUser, post, editMutation } = this.props

      let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
      if (!suggestUserIds.includes(currentUser._id)) {
        suggestUserIds.push(currentUser._id)
      }

      editMutation({
        documentId: post._id,
        set: {deletedByUser:true},
        unset: {}
      })
    }
  }

  render() {
    const { currentUser, post, Container } = this.props;
    if (currentUser && Posts.canDelete(currentUser, post)) {
      return <div onClick={this.handleDelete}>
              <Container>
                Delete Post
              </Container>
            </div>
    } else {
      return null
    }
  }
}

const withEditOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}

registerComponent(
  'DeletePost',
  DeletePost,
  [withEdit, withEditOptions],
  withUser
);
