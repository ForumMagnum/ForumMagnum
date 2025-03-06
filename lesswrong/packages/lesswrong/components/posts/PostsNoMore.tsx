import { registerComponent } from '../../lib/vulcan-lib/components';
import React from "react";

const PostsNoMore = () => <p className="posts-no-more">No more posts.</p>;

const PostsNoMoreComponent = registerComponent('PostsNoMore', PostsNoMore);

declare global {
  interface ComponentTypes {
    PostsNoMore: typeof PostsNoMoreComponent
  }
}

export default PostsNoMoreComponent;

