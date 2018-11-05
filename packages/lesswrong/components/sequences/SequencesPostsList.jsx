import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withUser from '../common/withUser';

const SequencesPostsList = ({posts, chapter, currentUser}) =>

  <div className="sequences-posts-list">
    {posts.map((post) => <Components.PostsItem key={post._id} post={post} chapter={chapter} currentUser={currentUser} />)}
  </div>

registerComponent('SequencesPostsList', SequencesPostsList, withUser)
