import { Components } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const PostsListHeader = () => {

  return (
    <div>
      <div className="posts-list-header">
        <Components.PostsViews />
        <Components.SearchForm/>
      </div>
    </div>
  )
}

export default defineComponent({
  name: 'PostsListHeader',
  component: PostsListHeader
});

