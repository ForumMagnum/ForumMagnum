import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

import { secondaryInfo } from '../tagging/TagProgressBar';
import { gatherIcon } from '../icons/gatherIcon';
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 20,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: "flex",
    '& a': {
      color: theme.palette.primary.main
    },
    alignItems: "center"
  },
  secondaryInfo: {
    ...secondaryInfo(theme),
    marginTop: 0,
    display: "flex",
    justifyContent: "space-between",
  },
  icon: {
    marginRight: 24,
    marginLeft: 6,
  },
  hide: {
    cursor: "pointer",

  }
})

const GatherTown = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { flash } = useMessages();

  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });


  if (!currentUser) return null
  if (currentUser.hideWalledGardenUI) return null

  const hideClickHandler = async () => {
    await updateUser({
      selector: { _id: currentUser._id },
      data: {
        hideWalledGardenUI: true
      },
    })
    flash({
      messageString: "Hid Walled Garden from frontpage",
      type: "success",
      action: () => void updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideWalledGardenUI: false
        },
      })
    })
  }

  return (
    <div className={classes.root}>
      <div className={classes.icon}>{gatherIcon} </div>
      <div>
        <div>You're invited to the <a href="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus">Walled Garden Beta</a></div>
        <div className={classes.secondaryInfo}>
          <div>A private, permanent virtual world. Coworking 12pm-6pm PT weekdays. Social hours at 1pm and 6pm.</div>
          <a className={classes.hide} onClick={hideClickHandler}>Hide</a>
        </div>
      </div>
    </div>
  )
}

const GatherTownComponent = registerComponent('GatherTown', GatherTown, {styles});

declare global {
  interface ComponentTypes {
    GatherTown: typeof GatherTownComponent
  }
}

