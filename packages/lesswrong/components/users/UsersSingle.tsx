import { Components, registerComponent, Utils } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { userGetProfileUrlFromSlug } from "../../lib/collections/users/helpers";

const UsersSingle = () => {
  const { params, pathname } = useLocation();
  
  const slug = Utils.slugify(params.slug);
  const canonicalUrl = userGetProfileUrlFromSlug(slug);
  if (pathname !== canonicalUrl) {
    // A Javascript redirect, which replaces the history entry (so you don't
    // have a redirector interfering with the back button). Does not cause a
    // pageload.
    return <Components.PermanentRedirect url={canonicalUrl} />;
  } else {
    return <Components.UsersProfile terms={{view: 'usersProfile', slug}} slug={slug} />
  }
};

const UsersSingleComponent = registerComponent('UsersSingle', UsersSingle);

declare global {
  interface ComponentTypes {
    UsersSingle: typeof UsersSingleComponent
  }
}
