import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';

class MoveToDraft extends Component {

  handleMoveToDraft = () => {
    const { post, updatePost } = this.props

    updatePost({
      selector: {_id: post._id},
      data: {draft:true}
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

const withUpdateOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}

registerComponent(
  'MoveToDraft',
  MoveToDraft,
  [withUpdate, withUpdateOptions],
  withUser
);
