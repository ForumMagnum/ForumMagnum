import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useLocation } from '../../lib/routeUtil';
import { styles } from '../common/HeaderSubtitle';
import { getUserFromResults } from '../users/UsersProfile';
import { Helmet } from '../../lib/utils/componentsWithChildren';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const UsersMinimumInfoMultiQuery = gql(`
  query multiUserUserPageTitleQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersMinimumInfo
      }
      totalCount
    }
  }
`);

const titleComponentStyles = defineStyles('UserPageTitle', styles);

export const UserPageTitle = ({isSubtitle, siteName}: {
  isSubtitle: boolean,
  siteName: string,
}) => {
  const classes = useStyles(titleComponentStyles);

  const { params: {slug} } = useLocation();
  const { data, loading } = useQuery(UsersMinimumInfoMultiQuery, {
    variables: {
      selector: { usersProfile: { slug: slug } },
      limit: 10,
      enableTotal: false,
    },
    // Ugly workaround: For unclear reasons, this title component (but not the
    // posts-page or sequences-page title components) fails (results undefined)
    // if fetchPolicy is cache-only. When set to cache-first, it works,
    // without generating any network requests.
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.users?.results;
  
  if (!results || loading) return null;
  
  const user = getUserFromResults(results);
  if (!user) return null;
  const userLink = userGetProfileUrl(user);
  const userNameString = user.displayName || user.slug;
  const titleString = `${userNameString} - ${siteName}`
  
  // Ray note: I think it was just a mistake to have the User Profile subtitle 
  // on the UsersProfile page, because it's just superfluous with the actual header
  // title. I've removed that use of this component, and I don't think there's another
  // currently-in-use subtitle version of this component. Probably should remove
  // the option, unless we want to go back to using the User subtitle on personal blogposts.
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
