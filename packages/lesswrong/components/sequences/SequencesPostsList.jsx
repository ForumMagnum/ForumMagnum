import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';

const SequencesPostsList = ({posts, chapter}) =>

  <div className="sequences-posts-list">
    {posts.map((post) => <Components.PostsItem key={post._id} post={post} chapter={chapter} />)}
  </div>

registerComponent('SequencesPostsList', SequencesPostsList)
