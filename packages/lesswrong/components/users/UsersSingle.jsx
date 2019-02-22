import { Components, registerComponent, Utils } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';

const UsersSingle = ({params, router}) => {
  const slug = Utils.slugify(params.slug);
  const canonicalUrl = `/users/${slug}`;
  if (router.location.pathname !== canonicalUrl) {
    router.replace(canonicalUrl);
    return null;
  } else {
    return <Components.UsersProfile userId={params._id} slug={slug} />
  }
};

UsersSingle.displayName = "UsersSingle";

registerComponent('UsersSingle', UsersSingle, withRouter);
