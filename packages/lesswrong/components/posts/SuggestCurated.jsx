import { registerComponent, withEdit, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

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
        getSetting('forumType') !== 'AlignmentForum' &&
        Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return <div className="posts-page-suggest-curated">
        { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser._id) ?
          <div onClick={this.handleSuggestCurated}>
            <MenuItem>
              Suggest Curation
            </MenuItem>
          </div> :
          <div onClick={this.handleUnsuggestCurated}>
            <MenuItem>
              Unsuggest Curation
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
  'SuggestCurated',
  SuggestCurated,
  [withEdit, withEditOptions],
  withUser
);
