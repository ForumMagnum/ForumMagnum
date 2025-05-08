import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import type { ConnectedUserInfo } from "./CKPostEditor";
import keyBy from 'lodash/keyBy';
import { useSingle } from '../../lib/crud/withSingle';
import classNames from 'classnames';
import CloudOff from "@/lib/vendor/@material-ui/icons/src/CloudOff";
import { UsersName } from "../users/UsersName";

const styles = (theme: ThemeType) => ({
  user: {
    ...theme.typography.body2,
    marginRight: 8,
  },
  connected: {
  },
  disconnected: {
    color: theme.palette.text.dim40,
    '& $activeDot': {
      display: 'none',
    },
  },
  offlineIcon: {
    marginRight: 2,
    top: 2,
    position: "relative",
    "& svg": {
      fontSize: 13,
    },
  },
  activeDot: {
    height: 7,
    width: 7,
    backgroundColor: theme.palette.secondary.light,
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: `0 0 5px ${theme.palette.secondary.light}, 0 0 8px ${theme.palette.secondary.light}`,
    marginRight: 4,
    marginLeft: 9
  },
})

/**
 * UI for displaying who's currently connected, in the collaborative editor.
 * This is used inside fo EditorTopBar. If alwaysShownUserIds is provided, those
 * users will be shown even if they're not connected (but grayed out).
 */
const PresenceListInner = ({connectedUsers, alwaysShownUserIds, classes}: {
  connectedUsers: ConnectedUserInfo[],
  alwaysShownUserIds?: string[],
  classes: ClassesType<typeof styles>,
}) => {
  const connectedUsersById = keyBy(connectedUsers, u=>u._id);
  const disconnectedUserIds: string[] = alwaysShownUserIds
    ? alwaysShownUserIds.filter(userId => !connectedUsersById[userId])
    : [];

  return <div>
    {connectedUsers.map(u => <PresenceListUser
      key={u._id}
      connected={true}
      userId={u._id}
      isLoggedOutUser={u.name==="Anonymous"}
      classes={classes}
    />)}
    {disconnectedUserIds.map(userId => <PresenceListUser
      key={userId}
      connected={false}
      userId={userId}
      isLoggedOutUser={false}
      classes={classes}
    />)}
  </div>
}

const PresenceListUser = ({userId, isLoggedOutUser, connected, classes}: {
  userId: string,
  isLoggedOutUser: boolean,
  connected: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { document: user, loading } = useSingle({
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    documentId: userId,
    skip: isLoggedOutUser,
  });

  if (loading) {
    return <span/>
  }
  return <span className={classNames(classes.user, {
    [classes.connected]: connected,
    [classes.disconnected]: !connected,
  })}>
    <div className={classes.activeDot}>
    </div>
    <span className={classes.offlineIcon}>{!connected && <CloudOff/>}</span>
    {user && <UsersName user={user}/>}
    {isLoggedOutUser && <>Anonymous</>}
  </span>
}

export const PresenceList = registerComponent('PresenceList', PresenceListInner, {styles});

declare global {
  interface ComponentTypes {
    PresenceList: typeof PresenceList
  }
}
