import React from 'react';
import { registerComponent, withDocument } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import Users from 'meteor/vulcan:users';
import mapProps from 'recompose/mapProps';
import { withLocation } from '../../lib/routeUtil';
import Helmet from 'react-helmet';

const UserPageTitle = ({location, isSubtitle, siteName, loading, document}) => {
  if (!document || loading) return null;
  
  const user = document;
  const userLink = Users.getProfileUrl(user);
  const userNameString = user.displayName || user.slug;
  
  if (isSubtitle)
    return <Link to={userLink}>{userNameString}</Link>
  else
    return <Helmet><title>{`${userNameString} - ${siteName}`}</title></Helmet>
}
registerComponent("UserPageTitle", UserPageTitle,
  withLocation,
  mapProps((props) => {
    const {location} = props;
    const {params: {slug}} = location;
    return {
      terms: {view: "usersProfile", slug: slug},
      ...props
    }
  }),
  [withDocument, {
    collection: Users,
    fragmentName: "UsersMinimumInfo",
    ssr: true,
  }]
);