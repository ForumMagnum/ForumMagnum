import { Components } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const PostsStats = ({post}) => {

  return (
    <div className="posts-stats">
      {post.score &&
        <span className="posts-stats-item" title="Score">
          {Math.floor((post.score || 0)*10000)/10000}
        </span>
      }
      <span className="posts-stats-item" title="Views">
        {post.viewCount || 0}
      </span>
    </div>
  )
}

export default defineComponent({
  name: 'PostsStats',
  component: PostsStats
});
