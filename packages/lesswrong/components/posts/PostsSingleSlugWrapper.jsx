import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil.js';

const PostsSingleSlugWrapper = () => {
  const { params } = useLocation();
  return <Components.PostsSingleSlug terms={{view:"slugPost", slug: params.slug}} />
};

registerComponent('PostsSingleSlugWrapper', PostsSingleSlugWrapper);
