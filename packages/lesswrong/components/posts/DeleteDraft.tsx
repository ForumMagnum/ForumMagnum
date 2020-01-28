import { registerComponent } from 'meteor/vulcan:core';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

interface DeleteDraftProps extends WithUserProps {
  post: any,
  updatePost: any,
}

class DeleteDraft extends Component<DeleteDraftProps,{}> {

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

const DeleteDraftComponent = registerComponent(
  'DeleteDraft', DeleteDraft, {
    hocs: [
      withUpdate({
        collection: Posts,
        fragmentName: 'PostsList',
      }),
      withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    DeleteDraft: typeof DeleteDraftComponent
  }
}
