import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { ConnectedUserInfo } from "./CKPostEditor";
import keyBy from 'lodash/keyBy';
import { useSingle } from '../../lib/crud/withSingle';
import classNames from 'classnames';
import CloudOff from "@material-ui/icons/CloudOff";

const styles = (theme: ThemeType): JssStyles => ({
  user: {
    ...theme.typography.body2,
    marginRight: 8,
  },
  connected: {
  },
  disconnected: {
    color: theme.palette.text.dim40,
  },
  offlineIcon: {
    marginRight: 2,
    top: 2,
    position: "relative",
    "& svg": {
      fontSize: 13,
    },
  },
})

/**
 * UI for displaying who's currently connected, in the collaborative editor.
 * This is used inside fo EditorTopBar. If alwaysShownUserIds is provided, those
 * users will be shown even if they're not connected (but grayed out).
 */
const PresenceList = ({connectedUsers, alwaysShownUserIds, classes}: {
  connectedUsers: ConnectedUserInfo[],
  alwaysShownUserIds?: string[],
  classes: ClassesType,
}) => {
  const connectedUsersById = keyBy(connectedUsers, u=>u._id);
  const disconnectedUserIds: string[] = alwaysShownUserIds
    ? alwaysShownUserIds.filter(userId => !connectedUsersById[userId])
    : [];

  return <div>
    {connectedUsers.map(u => <PresenceListUser key={u._id} connected={true} userId={u._id} classes={classes}/>)}
    {disconnectedUserIds.map(userId => <PresenceListUser key={userId} connected={false} userId={userId} classes={classes}/>)}
  </div>
}

const PresenceListUser = ({userId, connected, classes}: {
  userId: string,
  connected: boolean,
  classes: ClassesType,
}) => {
  const { document: user } = useSingle({
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    documentId: userId
  });

  if (!user) {
    return <span/>
  }
  return <span className={classNames(classes.user, {
    [classes.connected]: connected,
    [classes.disconnected]: !connected,
  })}>
    <span className={classes.offlineIcon}>{!connected && <CloudOff/>}</span>
    <Components.UsersName user={user}/>
  </span>
}

const PresenceListComponent = registerComponent('PresenceList', PresenceList, {styles});

declare global {
  interface ComponentTypes {
    PresenceList: typeof PresenceListComponent
  }
}

