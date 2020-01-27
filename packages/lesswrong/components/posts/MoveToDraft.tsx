import { registerComponent } from 'meteor/vulcan:core';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

interface MoveToDraftProps extends WithUserProps {
  post: any,
  updatePost: any,
}

class MoveToDraft extends Component<MoveToDraftProps> {

  handleMoveToDraft = () => {
    const { post, updatePost } = this.props

    updatePost({
      selector: {_id: post._id},
      data: {draft:true}
    })
  }

  render() {
    const { currentUser, post } = this.props;
    if (!post.draft && currentUser && Posts.canEdit(currentUser, post)) {
      return <div onClick={this.handleMoveToDraft}>
        <MenuItem>
          Move to Draft
        </MenuItem>
      </div>
    } else {
      return null
    }
  }
}

const MoveToDraftComponent = registerComponent(
  'MoveToDraft',
  MoveToDraft,
  withUpdate({
    collection: Posts,
    fragmentName: 'PostsList',
  }),
  withUser
);

declare global {
  interface ComponentTypes {
    MoveToDraft: typeof MoveToDraftComponent
  }
}
