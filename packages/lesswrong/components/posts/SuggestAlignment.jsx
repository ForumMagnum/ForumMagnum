import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

class SuggestAlignment extends Component {
  render() {
    const { currentUser, post, updatePost, Container } = this.props;

    const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    if (Users.canSuggestPostForAlignment({currentUser, post})) {
      return <div>
          { userHasSuggested ?
            <div  onClick={() => Posts.unSuggestForAlignment({currentUser, post, updatePost})}>
              <Container>
                Ω Unsuggest for Alignment
              </Container>
            </div>
            :
            <div  onClick={() => Posts.suggestForAlignment({currentUser, post, updatePost})}>
              <Container>
                Ω Suggest for Alignment
              </Container>
            </div>
          }
        </div>
    } else {
      return null
    }
  }
}

const withUpdateOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}

registerComponent(
  'SuggestAlignment',
  SuggestAlignment,
  [withUpdate, withUpdateOptions],
  withUser
);
