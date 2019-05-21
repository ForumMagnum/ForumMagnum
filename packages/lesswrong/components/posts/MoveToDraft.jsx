import { registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';

class MoveToDraft extends Component {

  handleMoveToDraft = () => {
    const { post, editMutation } = this.props

    editMutation({
      documentId: post._id,
      set: {draft:true},
      unset: {}
    })
  }

  render() {
    const { currentUser, post, Container } = this.props;
    if (!post.draft && currentUser && Posts.canEdit(currentUser, post)) {
      return <div onClick={this.handleMoveToDraft}>
              <Container>
                Move to Draft
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
  'MoveToDraft',
  MoveToDraft,
  [withEdit, withEditOptions],
  withUser
);
