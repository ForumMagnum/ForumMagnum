import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const PostsSingleSlugWrapper = (props, context) => {
<<<<<<< HEAD
=======
  console.log("ZXCV", props.params.slug)
>>>>>>> collectionsRouting
  return <Components.PostsSingleSlug terms={{view:"slugPost", slug: props.params.slug}} />
};

PostsSingleSlugWrapper.displayName = "PostsSingleSlugWrapper";

registerComponent('PostsSingleSlugWrapper', PostsSingleSlugWrapper);
