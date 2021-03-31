/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import * as _ from 'underscore';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { userCanDo } from '../../lib/vulcan-users';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[50],
    padding: 12,
    border: "solid 1px rgba(0,0,0,.1)"
  }
})

const SunshineNewUsersProfileInfo = ({userId, classes}:{userId:string, classes: ClassesType}) => {

  const currentUser = useCurrentUser()

  const { SunshineNewUsersInfo } = Components

  const { document: user } = useSingle({
    documentId:userId,
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });

  if (!user) return null
  if (!userCanDo(currentUser, 'posts.moderate.all')) return null
  if (user.reviewedByUserId && !user.sunshineSnoozed) return null
  return <div className={classes.root}>
      <SunshineNewUsersInfo user={user}/>
    </div>
}

const SunshineNewUsersProfileInfoComponent = registerComponent('SunshineNewUsersProfileInfo', SunshineNewUsersProfileInfo, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUsersProfileInfo: typeof SunshineNewUsersProfileInfoComponent
  }
}

