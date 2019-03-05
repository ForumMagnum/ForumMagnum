import { registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';

class DeleteDraft extends Component {

  handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      const { post, editMutation } = this.props

      editMutation({
        documentId: post._id,
        set: {deletedDraft:true, draft: true},
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
  'DeleteDraft',
  DeleteDraft,
  [withEdit, withEditOptions],
  withUser
);
