import { registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

class SuggestAlignment extends Component {
  render() {
    const { currentUser, post, editMutation } = this.props;

    const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    if (Users.canSuggestPostForAlignment({currentUser, post})) {
      return <div>
        { userHasSuggested ?
          <div  onClick={() => Posts.unSuggestForAlignment({currentUser, post, editMutation})}>
            <MenuItem>
              Ω Unsuggest for Alignment
            </MenuItem>
          </div>
          :
          <div  onClick={() => Posts.suggestForAlignment({currentUser, post, editMutation})}>
            <MenuItem>
              Ω Suggest for Alignment
            </MenuItem>
          </div>
        }
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
  'SuggestAlignment',
  SuggestAlignment,
  [withEdit, withEditOptions],
  withUser
);
