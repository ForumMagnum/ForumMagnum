/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { userCanDo } from '../../lib/vulcan-users';
import NoSsr from '@material-ui/core/NoSsr';
import { useUpdate } from '../../lib/crud/withUpdate';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[50],
    padding: 12,
    border: "solid 1px rgba(0,0,0,.1)"
  }
})

const SunshineNewUsersProfileInfo = ({userId, classes}:{userId:string, classes: ClassesType}) => {

  const currentUser = useCurrentUser()

  const { SunshineNewUsersInfo, SectionButton } = Components

  const { document: user } = useSingle({
    documentId:userId,
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });

  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });

  const unapproveUser = async () => {
    await updateUser({
      selector: { _id: userId },
      data: {
        sunshineSnoozed: true
      },
    })
  }

  if (!user) return null
  if (!userCanDo(currentUser, 'posts.moderate.all')) return null
  
  if (user.reviewedByUserId && !user.sunshineSnoozed) return <div className={classes.root} onClick={unapproveUser}>
    <SectionButton>Unapprove</SectionButton>
  </div>
  
  return <div className={classes.root}>
    <NoSsr>
      <SunshineNewUsersInfo user={user}/>
    </NoSsr>
  </div>
}

const SunshineNewUsersProfileInfoComponent = registerComponent('SunshineNewUsersProfileInfo', SunshineNewUsersProfileInfo, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUsersProfileInfo: typeof SunshineNewUsersProfileInfoComponent
  }
}


