import { Components } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const PostsSingleRoute = (props) => {
  if (props.route._id) {
    return <Components.PostsPage documentId={props.route._id } />
  }
};

export default defineComponent({
  name: 'PostsSingleRoute',
  component: PostsSingleRoute
});
