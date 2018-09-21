import { Components , registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

class SuggestAlignment extends Component {
  handleSuggestAlignment = () => {
    const { currentUser, post, editMutation } = this.props
    const suggestUserIds = post.suggestForAlignmentUserIds || []
    const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
    editMutation({
      documentId: post._id,
      set: {suggestForAlignmentUserIds: newSuggestUserIds},
      unset: {}
    })
  }

  handleUnsuggestAlignment = () => {
    const { currentUser, post, editMutation } = this.props
    const suggestUserIds = post.suggestForAlignmentUserIds || []
    const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
    editMutation({
      documentId: post._id,
      set: {suggestForAlignmentUserIds:newSuggestUserIds},
      unset: {}
    })
  }

  render() {
    const { currentUser, post } = this.props;

    const shouldRender = currentUser && post && !post.afDate && !post.reviewForAlignmentUserId && Users.canDo(this.props.currentUser, "posts.alignment.suggest")

    const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    if (shouldRender) {
      return <div>
          { userHasSuggested ?
            <a onClick={this.handleUnsuggestAlignment}>
              Ω Unsuggest for Alignment
            </a>
            :
            <a onClick={this.handleSuggestAlignment}>
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
