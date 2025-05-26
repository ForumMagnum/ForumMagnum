import React, { useState } from 'react';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import LockIcon from '@/lib/vendor/@material-ui/icons/src/Lock'
import LockOpenIcon from '@/lib/vendor/@material-ui/icons/src/LockOpen'
import flatMap from 'lodash/flatMap';
import Loading from "../../vulcan-core/Loading";
import LWTooltip from "../../common/LWTooltip";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SunshineUsersListMultiQuery = gql(`
  query multiUserAltAccountInfoQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineUsersList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {

  },
  icon: {
    width: 12,
    height: 12,
    cursor: "pointer",
    color: theme.palette.grey[500],
    marginLeft: 2,
    marginTop: 1
  }
});

export const AltAccountInfo = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  const [showAlternateAccounts, setShowAlternateAccounts] = useState<boolean>(false)
  const associatedUserIds: string[] = user.associatedClientIds
    ? flatMap(user.associatedClientIds, clientId=>(clientId.userIds||[]))
    : [];
  const { data, loading } = useQuery(SunshineUsersListMultiQuery, {
    variables: {
      selector: { usersByUserIds: { userIds: associatedUserIds } },
      limit: 10,
      enableTotal: false,
    },
    skip: !(associatedUserIds.length > 0),
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.users?.results;

  const flaggedAccounts = results?.filter(result => result._id !== user._id && (!!result.banned || result.postingDisabled || result.allCommentingDisabled || result.commentingOnOtherUsersDisabled || result.conversationsDisabled || result.karma < 0))
  
  const flaggedText = ((flaggedAccounts?.length || 0) >= 1) && <LWTooltip title="One or more users have been banned, had their permissions disabled, or have < 0 karma"><span>
    ({flaggedAccounts?.length} flagged)
  </span></LWTooltip>

  const altAccounts = results?.filter(altUser => altUser._id !== user._id)

  return <div className={classes.root}>
    <em>
      <Link to={`/moderation/altAccounts?slug=${user.slug}`}>
        Alternate accounts detected
      </Link>
      {" "}
      {flaggedText}
    </em>
    <LWTooltip title={<div><p>Click to show alts. Please don't look unless you have reason to suspect this account of suspicious activity</p><p><em>(it's fine for established users to have alts and the mods should not go out of our way to look at them).</em></p></div>}>
      <span onClick={() => setShowAlternateAccounts(!showAlternateAccounts)}>
        {showAlternateAccounts ? <LockOpenIcon className={classes.icon}/> : <LockIcon className={classes.icon}/>}
      </span>
    </LWTooltip>
    {loading && associatedUserIds.length>0 && <Loading/>}
    {showAlternateAccounts && altAccounts?.map(user => <li key={`${user._id}`}>
      <Link to={userGetProfileUrl(user)}>{user.displayName}</Link> {user.deleted && <>[Deleted]</>}
    </li>)}
  </div>;
}

export default registerComponent('AltAccountInfo', AltAccountInfo, {styles});



