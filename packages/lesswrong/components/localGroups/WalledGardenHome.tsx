import { Typography } from '@material-ui/core';
import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const styles = () => ({
  
})

const WalledGardenHome = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection } = Components
  const currentUser = useCurrentUser()
  const { results: users } = useMulti({
    terms: {
      view: "walledGardenInvitees",
    },
    fragment: "UsersCurrent"
  })

  if (!currentUser || currentUser.walledGardenInvite) { return null }

  return <SingleColumnSection>
    <Typography variant="display3">
      Walled Garden
    </Typography>
    {users.map((user)=><div key={user._id}>{user.displayName}</div>)}
  </SingleColumnSection>
}

const WalledGardenHomeComponent = registerComponent("WalledGardenHome", WalledGardenHome, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenHome: typeof WalledGardenHomeComponent
  }
}

