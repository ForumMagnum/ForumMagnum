import { Components , registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

class SuggestAlignment extends Component {
  render() {
    const { currentUser, post, editMutation } = this.props;

    const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    if (Users.canSuggestPostForAlignment({currentUser, post})) {
      return <div>
          { userHasSuggested ?
            <div>
              <a onClick={() => Posts.unSuggestForAlignment({currentUser, post, editMutation})}>
                Ω Unsuggest for Alignment
              </a>
            </div>
            :
            <div>
              <a onClick={() => Posts.suggestForAlignment({currentUser, post, editMutation})}>
                Ω Suggest for Alignment
              </a>
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
