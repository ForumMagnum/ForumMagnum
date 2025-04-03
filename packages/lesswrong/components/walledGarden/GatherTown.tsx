import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

import { gatherIcon } from '../icons/gatherIcon';
import { useMulti } from '../../lib/crud/withMulti';
import FiberManualRecordIcon from '@/lib/vendor/@material-ui/icons/src/FiberManualRecord';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import classNames from 'classnames'
import { Link } from '../../lib/reactRouterWrapper';
import { DatabasePublicSetting } from '../../lib/publicSettings';

export const gardenOpenToPublic = new DatabasePublicSetting<boolean>('gardenOpenToPublic', false)
export const gatherTownUserTrackingIsBroken = new DatabasePublicSetting<boolean>('gatherTownUserTrackingIsBroken', false)

const styles = (theme: ThemeType) => ({
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
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: theme.palette.text.dim55,
    marginTop: 8
  },
  usersOnlineList: {
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: theme.palette.text.dim55,
    display: "flex",
    justifyContent: 'flex-start',
    flexWrap: "wrap",
    marginTop: 0,
    marginBottom: 4
  },
  noUsers: {
    fontSize: '0.8rem',
    color: theme.palette.text.dim,
  },
  icon: {
    marginRight: 24,
    marginLeft: 6,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  hide: {
    position: 'absolute',
    top: 8,
    right: 8,
    cursor: "pointer",
    width: '0.5em',
    height: '0.5em',
    color: theme.palette.text.dim,
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
  },
  allEvents: {
    fontSize: ".8em",
    fontStyle: "italic"
  },
  gardenCodesList: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  }
})

const GatherTown = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "gatherTownUsers",
      limit: 1,
    },
    collectionName: "LWEvents",
    fragmentName: 'lastEventFragment',
    enableTotal: false,
  });
  const lastCheckResults = results && results[0]?.properties;
  const checkFailed = !lastCheckResults || lastCheckResults.checkFailed;
  const users = lastCheckResults?.gatherTownUsers;
  const userList = users && Object.keys(users)
  const currentUser = useCurrentUser()
  const { flash } = useMessages();

  const updateCurrentUser = useUpdateCurrentUser();

  const { LWTooltip, AnalyticsTracker, GardenCodesList } = Components

  if (!currentUser) return null
  if (!gardenOpenToPublic.get() && !currentUser.walledGardenInvite) return null
  if (gardenOpenToPublic.get() && currentUser.karma < 100) return null
  if (currentUser.hideWalledGardenUI) return null

  const hideClickHandler = async () => {
    await updateCurrentUser({
      hideWalledGardenUI: true
    })
    flash({
      messageString: "Hide Walled Garden from frontpage",
      type: "success",
      action: () => void updateCurrentUser({
        hideWalledGardenUI: false
      })
    })
  }

  const gatherTownURL = "/walledGardenPortal"

  const tooltip = currentUser.walledGardenInvite ? <LWTooltip title={
    <div>
      Click to read more about this space
    </div>
  }>
    <Link to="/walledGarden" className={classes.learn}>
      Learn More
    </Link>
  </LWTooltip> : null

  return (
    <div className={classes.root}>
      <CloseIcon className={classes.hide} onClick={hideClickHandler} />
      <div className={classes.icon}>{gatherIcon} </div>
      <div>
        <AnalyticsTracker eventType="link" eventProps={{to: gatherTownURL}} captureOnMount>
          <div><Link to={gatherTownURL}>Walled Garden Beta</Link></div>
        </AnalyticsTracker>
        {userList && userList.length > 0 && <div className={classes.usersOnlineList}>
            {Object.keys(users).map(user => <span className={classes.userName} key={user}><FiberManualRecordIcon className={classes.onlineDot}/> {user} {users[user]?.status && `(${users[user].status})`}</span>)}
            {tooltip}
        </div>}
        {!loading && (!userList || !userList.length) && <div className={classNames(classes.usersOnlineList, classes.noUsers)}>
          <FiberManualRecordIcon className={classNames(classes.onlineDot, classes.greyDot)}/>
          {(gatherTownUserTrackingIsBroken.get() || checkFailed)
            ? "Unable to autodetect whether users are currently online. Pop in to find out!"
            : "No users currently online. Check back later or be the first to join!"}
          {tooltip}
        </div>}
        <div className={classes.gardenCodesList}>
          <GardenCodesList personal={false} limit={2}/>
          {currentUser.walledGardenInvite && <GardenCodesList personal={true} limit={2}/>}
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
