import { Components , registerComponent, withCurrentUser, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

class SuggestCurated extends Component {
  handleSuggestCurated = () => {
    const { currentUser, post, editMutation } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    editMutation({
      documentId: post._id,
      set: {suggestForCuratedUserIds:suggestUserIds},
      unset: {}
    })
  }

  handleUnsuggestCurated = () => {
    const { currentUser, post, editMutation } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    editMutation({
      documentId: post._id,
      set: {suggestForCuratedUserIds:suggestUserIds},
      unset: {}
    })
  }

  render() {
    const { currentUser, post } = this.props;
    if (currentUser &&
        post &&
        post.frontpageDate &&
        !post.curatedDate &&
        !post.reviewForCuratedUserId &&
        Users.canDo(this.props.currentUser, "posts.suggestCurate")) {
      return <div className="posts-page-suggest-curated">
          { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser._id) ?
            <span
              className="posts-page-suggest-curated-button"
              onTouchTap={this.handleSuggestCurated}
              >
              Suggest Curation
            </span> :
            <span
              className="posts-page-suggest-curated-button suggested"
              onTouchTap={this.handleUnsuggestCurated}
              >
              Unsuggest Curation
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
  fragmentName: 'LWPostsList',
}

registerComponent(
  'SuggestCurated',
  SuggestCurated,
  [withEdit, withEditOptions],
  withCurrentUser
);
