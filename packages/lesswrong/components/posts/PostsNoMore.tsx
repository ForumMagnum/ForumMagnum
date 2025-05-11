import { registerComponent } from '../../lib/vulcan-lib/components';
import React from "react";

const PostsNoMore = () => <p className="posts-no-more">No more posts.</p>;

export default registerComponent('PostsNoMore', PostsNoMore);



