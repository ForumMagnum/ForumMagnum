/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import * as _ from 'underscore';
import { useSingle } from '../../lib/crud/withSingle';

const SunshineNewUsersProfileInfo = ({userId}:{userId:string}) => {

  const { SunshineNewUsersInfo } = Components

  const { document: user } = useSingle({
    documentId:userId,
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });
  return <SunshineNewUsersInfo user={user}/>
}

const SunshineNewUsersProfileInfoComponent = registerComponent('SunshineNewUsersProfileInfo', SunshineNewUsersProfileInfo);

declare global {
  interface ComponentTypes {
    SunshineNewUsersProfileInfo: typeof SunshineNewUsersProfileInfoComponent
  }
}

