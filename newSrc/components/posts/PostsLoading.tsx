import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const PostsLoading = () => {
  return <div className="posts-load-more-loading"><Components.Loading/></div>
};

const PostsLoadingComponent = registerComponent('PostsLoading', PostsLoading);

declare global {
  interface ComponentTypes {
    PostsLoading: typeof PostsLoadingComponent
  }
}

