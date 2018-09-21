import { Components , registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

class SuggestAlignment extends Component {
  handleSuggestAlignment = () => {
    const { currentUser, post, editMutation } = this.props
    let suggestUserIds = _.clone(post.suggestForAlignmentUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    editMutation({
      documentId: post._id,
      set: {suggestForAlignmentUserIds:suggestUserIds},
      unset: {}
    })
  }

  handleUnsuggestAlignment = () => {
    const { currentUser, post, editMutation } = this.props
    let suggestUserIds = _.clone(post.suggestForAlignmentUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    editMutation({
      documentId: post._id,
      set: {suggestForAlignmentUserIds:suggestUserIds},
      unset: {}
    })
  }

  render() {
    const { currentUser, post } = this.props;
    if (currentUser &&
        post &&
        !post.afDate &&
        !post.reviewForAlignmentUserId &&
        Users.canDo(this.props.currentUser, "posts.alignment.new")) {
      return <div className="posts-page-suggest-curated">
          { !post.suggestForAlignmentUserIds || !post.suggestForAlignmentUserIds.includes(currentUser._id) ?
            <span
              className="posts-page-suggest-curated-button"
              onClick={this.handleSuggestAlignment}
              >
              Ω Suggest for Alignment
            </span> :
            <span
              className="posts-page-suggest-curated-button suggested"
              onClick={this.handleUnsuggestAlignment}
              >
              Ω Unsuggest for Alignment
            </span>
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
