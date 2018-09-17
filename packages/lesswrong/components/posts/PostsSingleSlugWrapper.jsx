import { Components } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const PostsSingleSlugWrapper = (props, context) => {
  return <Components.PostsSingleSlug terms={{view:"slugPost", slug: props.params.slug}} />
};

export default defineComponent({
  name: 'PostsSingleSlugWrapper',
  component: PostsSingleSlugWrapper
});
