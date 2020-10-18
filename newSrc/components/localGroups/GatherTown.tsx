import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';

import { secondaryInfo } from '../tagging/TagProgressBar';
import { gatherIcon } from '../icons/gatherIcon';
import { LWEvents } from '../../lib/collections/lwevents';
import { useMulti } from '../../lib/crud/withMulti';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import CloseIcon from '@material-ui/icons/Close';
import classNames from 'classnames'
import { Link } from '../../lib/reactRouterWrapper';
import { DatabasePublicSetting, gatherTownRoomId, gatherTownRoomName } from '../../lib/publicSettings';

const gatherMessage = new DatabasePublicSetting<string>('gatherTownMessage', 'Coworking on weekdays. Schelling Social hours at Tues 1pm PT, and Thurs 6pm PT.')

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 20,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: "flex",
    '& a': {
      color: theme.palette.primary.main
    },
    alignItems: "center",
    position: 'relative',
    '&:hover $hide': {
      opacity: 1
    },
    marginBottom: 8
  },
  secondaryInfo: {
    ...secondaryInfo(theme),
    marginTop: 0,
    display: "flex",
    justifyContent: "space-between",
  },
  usersOnlineList: {
    ...secondaryInfo(theme),
    justifyContent: 'flex-start',
    flexWrap: "wrap",
    marginTop: 0
  },
  noUsers: {
    fontSize: '0.8rem',
    color: 'rgba(0,0,0,0.5)'
  },
  icon: {
    marginRight: 24,
    marginLeft: 6,
  },
  hide: {
    position: 'absolute',
    top: 8,
    right: 8,
    cursor: "pointer",
    width: '0.5em',
    height: '0.5em',
    color: 'rgba(0,0,0,0.5)',
    opacity: 0
  },
  onlineDot: {
    color: theme.palette.primary.main,
    width: '0.5em',
    height: '0.5em',
    position: 'relative',
    top: 2,
    display: 'inline-block',
    marginRight: '-2px'
  },
  greyDot: {
    color: theme.palette.grey[500],
    marginRight: 4,
    top: '3.5px'
  },
  userName: {
    marginRight: 5,
    whiteSpace: "pre"
  },
  learn: {
    marginLeft: 8,
    fontSize: ".8rem",
    color: theme.palette.grey[500],
    fontStyle: "italic"
  }
})

const GatherTown = ({classes}: {
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms: {
      view: "gatherTownUsers",
      limit: 1,
    },
    collection: LWEvents,
    fragmentName: 'lastEventFragment',
    enableTotal: false,
  });
  const users = results && results[0]?.properties?.gatherTownUsers
  const userList = users && Object.keys(users)
  const currentUser = useCurrentUser()
  const { flash } = useMessages();

  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const { LWTooltip, AnalyticsTracker } = Components


  if (!currentUser || !currentUser.walledGardenInvite) return null
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

  const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`
  const tooltip = <LWTooltip title={
    <div>
      Click to read more about this space
      <div>{"password: the12thvirtue"}</div></div>
    }>
      <Link to="/walledGarden" className={classes.learn}>
        Learn More
      </Link>
  </LWTooltip>
  return (
    <div className={classes.root}>
      <CloseIcon className={classes.hide} onClick={hideClickHandler} />
      <div className={classes.icon}>{gatherIcon} </div>
      <div>
        <AnalyticsTracker eventType="link" eventProps={{to: gatherTownURL}} captureOnMount>
          <div>You're invited to the <a href={gatherTownURL}>Walled Garden Beta</a></div>
        </AnalyticsTracker>
        <div className={classes.secondaryInfo}>
          <div>
            A private, permanent virtual world. {gatherMessage.get()}
          </div>
        </div>
        {userList && userList.length > 0 && <div className={classes.usersOnlineList}>
            {Object.keys(users).map(user => <span className={classes.userName} key={user}><FiberManualRecordIcon className={classes.onlineDot}/> {user}</span>)}
            {tooltip}
        </div>}
        {userList && !userList.length && <div className={classNames(classes.usersOnlineList, classes.noUsers)}>
          <FiberManualRecordIcon className={classNames(classes.onlineDot, classes.greyDot)}/> No users currently online. Check back later or be the first to join!
          {tooltip}
        </div>}
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
