import React from 'react';
import { registerComponent, useMulti } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import Users from 'meteor/vulcan:users';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../common/HeaderSubtitle';
import { getUserFromResults } from '../users/UsersProfile';

const UserPageTitle = ({isSubtitle, siteName, classes}) => {
  const { params: {slug} } = useLocation();
  const { results, loading } = useMulti({
    terms: {
      view: "usersProfile",
      slug: slug,
    },
    collection: Users,
    fragmentName: "UsersMinimumInfo",
    // Ugly workaround: For unclear reasons, this title component (but not the
    // posts-page or sequences-page title components) fails (results undefined)
    // if fetchPolicy is cache-only. When set to cache-then-network, it works,
    // without generating any network requests.
    fetchPolicy: 'cache-then-network',
    ssr: true,
  });
  
  if (!results || loading) return null;
  
  const user = getUserFromResults(results);
  if (!user) return null;
  const userLink = Users.getProfileUrl(user);
  const userNameString = user.displayName || user.slug;
  const titleString = `${userNameString} - ${siteName}`
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={userLink}>
        {userNameString}
      </Link>
    </span>);
  } else {
    return <Helmet>
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
  }
}
registerComponent("UserPageTitle", UserPageTitle,
  withStyles(styles, {name: "UserPageTitle"})
);
