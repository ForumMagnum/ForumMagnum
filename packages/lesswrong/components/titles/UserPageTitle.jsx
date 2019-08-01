import React from 'react';
import { registerComponent, withDocument } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import Users from 'meteor/vulcan:users';
import mapProps from 'recompose/mapProps';
import { withLocation } from '../../lib/routeUtil';
import Helmet from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../common/HeaderSubtitle';

const UserPageTitle = ({location, isSubtitle, siteName, loading, document, classes}) => {
  if (!document || loading) return null;
  
  const user = document;
  const userLink = Users.getProfileUrl(user);
  const userNameString = user.displayName || user.slug;
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={userLink}>
        {userNameString}
      </Link>
    </span>);
  } else {
    return <Helmet><title>{`${userNameString} - ${siteName}`}</title></Helmet>
  }
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
  }],
  withStyles(styles, {name: "UserPageTitle"})
);