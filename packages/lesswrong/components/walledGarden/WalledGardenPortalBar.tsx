import React, {useCallback, useEffect, useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Typography } from "@material-ui/core";
import {commentBodyStyles } from "../../themes/stylePiping";
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from "../../lib/vulcan-users";
import { useCurrentUser } from '../common/withUser';
import { KeyboardArrowUp, KeyboardArrowDown } from '@material-ui/icons';
import { CAL_ID } from "./gardenCalendar";
import moment from "moment"

const widgetStyling = {
  width: "450px",
  marginLeft: "30px",
}

const gatherTownRightSideBarWidth = 300

const styles = (theme) => ({
  root: {
    ...commentBodyStyles(theme),
    margin: "unset"
  },
  widgetsContainer: {
    display: "flex",
    justifyContent: "space-evenly"
  },
  portalBarButton: {
    position: "relative",
    left: `calc((100vw - ${gatherTownRightSideBarWidth}px)/2)`,
    "&:hover": {
      opacity: .5,
      background: "none"
    },
  },
  gardenCodeWidget: {
    ...widgetStyling
  },
  eventWidget: {
    ...widgetStyling
  },
  pomodoroTimerWidget: {
    ...widgetStyling
  },
  calendarLinks: {
    fontSize: ".8em",
    marginTop: "3px"
  }
})

export const WalledGardenPortalBar = ({iframeRef, classes}:{iframeRef:any, classes:ClassesType}) => {
  const { GardenCodeWidget, WalledGardenEvents, PomodoroWidget } = Components

  const currentUser =  useCurrentUser()
  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  })

  const barViewedMoreThan2DaysAgo =  moment(currentUser?.walledGardenPortalBarLastViewed).add(2, "days").isBefore(new Date())
  const [hideBar, setHideBar] = useState(currentUser?.hideWalledGardenPortalBar||barViewedMoreThan2DaysAgo)

  const updatePortalBarLastShown = useCallback(async () => {
    if (currentUser) {
      void updateUser({
        selector: {_id: currentUser._id},
        data: {
          walledGardenPortalBarLastViewed: new Date()
        },
      })
    }
  },[])

  useEffect(() => {
    if (!hideBar) updatePortalBarLastShown()
    }, [updatePortalBarLastShown, hideBar]
  )

  if (!currentUser) return null

  const chevronStyle = {fontSize: 50}
  const icon =  hideBar ? <KeyboardArrowUp style={chevronStyle}/> : <KeyboardArrowDown style={chevronStyle}/>
  const refocusOnIframe = () => iframeRef.current.focus()

  return <div className={classes.root}>
    <span className={classes.portalBarButton} onClick={ async () => {
      setHideBar(!hideBar);
      refocusOnIframe();
      void updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideWalledGardenPortalBar: !hideBar
        },
      })
    }}>
      { icon }
    </span>

    {!hideBar && <div className={classes.widgetsContainer}>
      {currentUser.walledGardenInvite && <div className={classes.gardenCodeWidget}>
        <GardenCodeWidget/>
      </div>}
      {currentUser.walledGardenInvite && <div className={classes.eventWidget} onClick={() => refocusOnIframe()}>
        <Typography variant="title">Upcoming Events</Typography>
        <WalledGardenEvents frontpage={false}/>
        <div className={classes.calendarLinks}>
          <div><a href={`https://calendar.google.com/calendar/u/0?cid=${CAL_ID}`} target="_blank" rel="noopener noreferrer" >View All Events
            (Gcal)</a></div>
          <div><a href={"https://www.facebook.com/groups/356586692361618/events"} target="_blank" rel="noopener noreferrer">FB Group Events</a>
          </div>
          <div><a href={"https://www.facebook.com/events/create/?group_id=356586692361618"} target="_blank" rel="noopener noreferrer">Create Event
            (FB)</a></div>
        </div>
      </div>}
      <div className={classes.pomodoroTimerWidget} onClick={() => refocusOnIframe()}>
        <PomodoroWidget />
      </div>
    </div>
    }
  </div>
}

const WalledGardenPortalBarComponent = registerComponent('WalledGardenPortalBar', WalledGardenPortalBar, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortalBar: typeof WalledGardenPortalBarComponent
  }
}
