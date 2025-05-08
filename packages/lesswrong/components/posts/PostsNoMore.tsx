import { registerComponent } from '../../lib/vulcan-lib/components';
import React from "react";

const PostsNoMoreInner = () => <p className="posts-no-more">No more posts.</p>;

export const PostsNoMore = registerComponent('PostsNoMore', PostsNoMoreInner);

declare global {
  interface ComponentTypes {
    PostsNoMore: typeof PostsNoMore
  }
}

