import { Components, registerComponent, Utils } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';
import Users from "meteor/vulcan:users";

const UsersSingle = ({params, router}) => {
  const slug = Utils.slugify(params.slug);
  const canonicalUrl = Users.getProfileUrlFromSlug(slug);
  if (router.location.pathname !== canonicalUrl) {
    // A Javascript redirect, which replaces the history entry (so you don't
    // have a redirector interfering with the back button). Does not cause a
    // pageload.
    router.replace(canonicalUrl);
    return null;
  } else {
    return <Components.UsersProfile userId={params._id} slug={slug} />
  }
};

UsersSingle.displayName = "UsersSingle";

registerComponent('UsersSingle', UsersSingle, withRouter);
