import React, { useState } from 'react';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { useSingle } from '../../../lib/crud/withSingle';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import LockIcon from '@material-ui/icons/Lock'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import flatMap from 'lodash/flatMap';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const [showAlternateAccounts, setShowAlternateAccounts] = useState<boolean>(false)
  const { Loading, LWTooltip } = Components

  const associatedUserIds: string[] = user.associatedClientIds
    ? flatMap(user.associatedClientIds, clientId=>(clientId.userIds||[]))
    : [];
  const { results, loading } = useMulti({
    terms: {
      view: "usersByUserIds",
      userIds:  associatedUserIds,
    },
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    skip: !(associatedUserIds.length > 0)
  });

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

const AltAccountInfoComponent = registerComponent('AltAccountInfo', AltAccountInfo, {styles});

declare global {
  interface ComponentTypes {
    AltAccountInfo: typeof AltAccountInfoComponent
  }
}

