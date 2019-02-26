import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router'
import PropTypes from 'prop-types';

const PostsEdit = ({post}) => {
  const link = {pathname:'/editPost', query:{postId: post._id, eventForm: post.isEvent}}
  return <Link to={link}>Edit</Link>
}

PostsEdit.displayName = "PostsEdit";

PostsEdit.propTypes = {
  post: PropTypes.object.isRequired,
};

registerComponent('PostsEdit', PostsEdit);
