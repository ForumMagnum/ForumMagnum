import React from 'react';
import { registerComponent, withList } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import Users from 'meteor/vulcan:users';
import mapProps from 'recompose/mapProps';
import { withLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../common/HeaderSubtitle';
import { getUserFromResults } from '../users/UsersProfile';

const UserPageTitle = ({location, isSubtitle, siteName, loading, results, classes}) => {
  if (!results || loading) return null;
  
  const user = getUserFromResults(results);
  if (!user) return null;
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
  [withList, {
    collection: Users,
    fragmentName: "UsersMinimumInfo",
    ssr: true,
  }],
  withStyles(styles, {name: "UserPageTitle"})
);