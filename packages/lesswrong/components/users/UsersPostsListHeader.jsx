import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const PostsListHeader = () => {

  return (
    <div>
      <div className="posts-list-header">
        <Components.UserPostsViews />
        <Components.SearchForm/>
      </div>
    </div>
  )
}

PostsListHeader.displayName = "PostsListHeader";

registerComponent('PostsListHeader', PostsListHeader);
