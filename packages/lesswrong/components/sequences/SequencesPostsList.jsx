import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withUser from '../common/withUser';

const SequencesPostsList = ({posts, chapter, currentUser}) =>
  <div>
    {posts.map((post) => <Components.PostsItem key={post._id} post={post} chapter={chapter} currentUser={currentUser} />)}
  </div>

registerComponent('SequencesPostsList', SequencesPostsList, withUser)
