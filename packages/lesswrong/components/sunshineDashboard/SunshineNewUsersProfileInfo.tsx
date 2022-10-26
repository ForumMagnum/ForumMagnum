import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { userCanDo } from '../../lib/vulcan-users';
import NoSsr from '@material-ui/core/NoSsr';
import { useUpdate } from '../../lib/crud/withUpdate';
import { getNewSnoozeUntilContentCount } from './ModeratorActions';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[50],
    padding: 12,
    border: theme.palette.border.faint,
  }
})

const SunshineNewUsersProfileInfo = ({userId, classes}:{userId:string, classes: ClassesType}) => {

  const currentUser = useCurrentUser()

  const { SunshineNewUsersInfo, SectionButton } = Components

  const { document: user, refetch } = useSingle({
    documentId:userId,
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });

  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });

  if (!user) return null

  const unapproveUser = async () => {
    await updateUser({
      selector: { _id: userId },
      data: {
        snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, 1)
      },
    })
  }

  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) return null
  
  if (user.reviewedByUserId && !user.snoozedUntilContentCount) return <div className={classes.root} onClick={unapproveUser}>
    <SectionButton>Unapprove</SectionButton>
  </div>
  
  return <div className={classes.root}>
    <NoSsr>
      <SunshineNewUsersInfo user={user} currentUser={currentUser} refetch={refetch}/>
    </NoSsr>
  </div>
}

const SunshineNewUsersProfileInfoComponent = registerComponent('SunshineNewUsersProfileInfo', SunshineNewUsersProfileInfo, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUsersProfileInfo: typeof SunshineNewUsersProfileInfoComponent
  }
}


