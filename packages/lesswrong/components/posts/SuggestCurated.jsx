import { registerComponent, withUpdate, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

class SuggestCurated extends Component {
  handleSuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  handleUnsuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  render() {
    const { currentUser, post, Container } = this.props;
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
              <Container>
                Suggest Curation
              </Container>
            </div> :
            <div onClick={this.handleUnsuggestCurated}>
              <Container>
                Unsuggest Curation
              </Container>
            </div>
          }
        </div>
    } else {
      return null
    }
  }
}

registerComponent(
  'SuggestCurated',
  SuggestCurated,
  [withUpdate, {
    collection: Posts,
    fragmentName: 'PostsList',
  }],
  withUser
);
