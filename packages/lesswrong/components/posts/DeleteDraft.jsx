import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

class DeleteDraft extends Component {

  handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      const { post, updatePost } = this.props

      updatePost({
        selector: {_id: post._id},
        data: {deletedDraft:true, draft: true}
      })
    }
  }

  render() {
    const { currentUser, post } = this.props;
    if (currentUser && Posts.canDelete(currentUser, post)) {
      return <div onClick={this.handleDelete}>
        <MenuItem>
          Delete Post
        </MenuItem>
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
  'DeleteDraft',
  DeleteDraft,
  [withUpdate, withUpdateOptions],
  withUser
);
