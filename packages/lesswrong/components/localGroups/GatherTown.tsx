import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useEffect, useState } from 'react';

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
import { getCalendarEvents, CAL_ID } from '../walledGarden/gardenCalendar';
import moment from 'moment';
import _uniqBy from 'lodash/uniqBy';

export const gardenOpenToPublic = new DatabasePublicSetting<boolean>('gardenOpenToPublic', false)

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
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: 'rgba(0,0,0,0.55)',
    marginTop: 8
  },
  eventTime: {
    fontSize: ".8em",
    opacity: .75
  },
  usersOnlineList: {
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: 'rgba(0,0,0,0.55)',
    display: "flex",
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
  },
  allEvents: {
    fontSize: ".8em",
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
  const [ events, setEvents ] = useState([])

  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const { LWTooltip, AnalyticsTracker } = Components

  useEffect(() => {
    const eventsCallback = (events) => {
      setEvents(_uniqBy(events, 'summary'))
    }

    if (Meteor.isClient) {
      getCalendarEvents(eventsCallback)
    }
  }, [])

  if (!currentUser) return null
  if (!gardenOpenToPublic.get() && !currentUser.walledGardenInvite) return null
  if (gardenOpenToPublic.get() && currentUser.karma < 100) return null
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

  const tooltip = currentUser.walledGardenInvite ? <LWTooltip title={
    <div>
      Click to read more about this space
      <div>{"password: the12thvirtue"}</div></div>
    }>
      <Link to="/walledGarden" className={classes.learn}>
        Learn More
      </Link>
  </LWTooltip> : null

  const eventComponent = (event) => <span>
    {event.summary}{" "}
    <span className={classes.eventTime}>{moment(new Date(event.start.dateTime)).calendar()}</span>
  </span>

  const eventsList = <div>
    {events.map((event, i)=><div key={`event-full-${i}`}>{eventComponent(event)}</div>)}
  </div>

  return (
    <div className={classes.root}>
      <CloseIcon className={classes.hide} onClick={hideClickHandler} />
      <div className={classes.icon}>{gatherIcon} </div>
      <div>
        <AnalyticsTracker eventType="link" eventProps={{to: gatherTownURL}} captureOnMount>
          <div><Link to={gatherTownURL}>Walled Garden Beta</Link></div>
        </AnalyticsTracker>
        {userList && userList.length > 0 && <div className={classes.usersOnlineList}>
            {Object.keys(users).map(user => <span className={classes.userName} key={user}><FiberManualRecordIcon className={classes.onlineDot}/> {user}</span>)}
            {tooltip}
        </div>}
        {userList && !userList.length && <div className={classNames(classes.usersOnlineList, classes.noUsers)}>
          <FiberManualRecordIcon className={classNames(classes.onlineDot, classes.greyDot)}/> No users currently online. Check back later or be the first to join!
          {tooltip}
        </div>}
        {(events.length > 0) && <div className={classes.secondaryInfo}>
          {events.slice(0,2).map((event,i)=><div key={`event-${i}`}>{eventComponent(event)}
          </div>)}
          <LWTooltip title={eventsList}>
              <a className={classes.allEvents} href={`https://calendar.google.com/calendar/u/0?cid=${CAL_ID}`}>View All Events</a>
          </LWTooltip>
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
