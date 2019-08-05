import { Components, registerComponent, Utils } from 'meteor/vulcan:core';
import React from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import Users from "meteor/vulcan:users";

const UsersSingle = () => {
  const { params, pathname } = useLocation();
  const { history } = useNavigation();
  
  const slug = Utils.slugify(params.slug);
  const canonicalUrl = Users.getProfileUrlFromSlug(slug);
  if (pathname !== canonicalUrl) {
    // A Javascript redirect, which replaces the history entry (so you don't
    // have a redirector interfering with the back button). Does not cause a
    // pageload.
    history.replace(canonicalUrl);
    return null;
  } else {
    return <Components.UsersProfile terms={{view: 'usersProfile', slug}} slug={slug} />
  }
};

registerComponent('UsersSingle', UsersSingle);
