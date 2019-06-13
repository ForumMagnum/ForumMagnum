import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const PostsSingleSlugWrapper = ({match: { params }}, context) => {
  return <Components.PostsSingleSlug terms={{view:"slugPost", slug: params.slug}} />
};

PostsSingleSlugWrapper.displayName = "PostsSingleSlugWrapper";

registerComponent('PostsSingleSlugWrapper', PostsSingleSlugWrapper);
