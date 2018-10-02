import { Components , registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

class SuggestAlignment extends Component {
  render() {
    const { currentUser, post, editMutation } = this.props;

    const shouldRender = currentUser && post && !post.afDate && !post.reviewForAlignmentUserId && Users.canDo(this.props.currentUser, "posts.alignment.suggest")

    const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    if (shouldRender) {
      return <div>
          { userHasSuggested ?
            <a onClick={() => Posts.unSuggestForAlignment({currentUser, post, editMutation})}>
              Ω Unsuggest for Alignment
            </a>
            :
            <a onClick={() => Posts.suggestForAlignment({currentUser, post, editMutation})}>
              Ω Suggest for Alignment
            </a>
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
