import React, { useState } from 'react';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { useSingle } from '../../../lib/crud/withSingle';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const AltAccountInfo = ({classes, user}: {
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const [showAlternateAccounts, setShowAlternateAccounts] = useState<boolean>(false)
  const { UsersNameDisplay, Loading, LWTooltip } = Components

  const { results, loading } = useMulti({
    terms: {
      view: "usersByUserIds",
      userIds: user.associatedClientId?.userIds
    },
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });
  
  return <div className={classes.root}>
    <LWTooltip title="Please do not click unless you have reason to suspect this account of suspicious activity. Use responsibly.">
      <a onClick={() => setShowAlternateAccounts(true)}><em>Alternate accounts detected ({user.associatedClientId?.userIds?.length})</em></a>
    </LWTooltip>
    {loading && <Loading/>}
    {results?.map(user => <li key={`${user._id}`}>
      <UsersNameDisplay user={user}/>
      {/* <Link to={userGetProfileUrl(user)}>{user.displayName}</Link> {user.deleted && <>[Deleted]</>} */}
    </li>)}
  </div>;
}

const AltAccountInfoComponent = registerComponent('AltAccountInfo', AltAccountInfo, {styles});

declare global {
  interface ComponentTypes {
    AltAccountInfo: typeof AltAccountInfoComponent
  }
}

