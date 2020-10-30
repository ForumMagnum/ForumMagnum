import React, {useCallback, useEffect, useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Button, Typography } from "@material-ui/core";
import {commentBodyStyles } from "../../themes/stylePiping";
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from "../../lib/vulcan-users";
import { useCurrentUser } from '../common/withUser';
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
    padding: 16,
    marginBottom: 0,
    marginTop: 0,
    position: "relative"
  },
  widgetsContainer: {
    display: "flex",
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
  },
  events: {
    width: 300
  }
})

export const WalledGardenPortalBar = ({iframeRef, classes}:{iframeRef:any, classes:ClassesType}) => {
  const { GardenCodeWidget, WalledGardenEvents, PomodoroWidget } = Components

  const currentUser =  useCurrentUser()

  if (!currentUser) return null
  const refocusOnIframe = () => iframeRef.current.focus()

  return <div className={classes.root}>
    <div className={classes.widgetsContainer}>
      {currentUser.walledGardenInvite && <div className={classes.events}>
        <Typography variant="title">Garden Events</Typography>
        <div className={classes.calendarLinks}>
          <div><a href={"https://www.facebook.com/events/create/?group_id=356586692361618"} target="_blank" rel="noopener noreferrer">
            <Button variant="outlined">Create FB Event</Button>
          </a></div>
          <GardenCodeWidget/>
          <div>
            <a href={"https://www.facebook.com/groups/356586692361618/events"} target="_blank" rel="noopener noreferrer">
              <Button>Facebook Group</Button>
            </a>
          </div>
          <div>
            <a href={`https://calendar.google.com/calendar/u/0?cid=${CAL_ID}`} target="_blank" rel="noopener noreferrer" >
              <Button>Google Calendar</Button>
            </a>
          </div>
        </div>
      </div>}
      {currentUser.walledGardenInvite && <div className={classes.eventWidget} onClick={() => refocusOnIframe()}>
        <WalledGardenEvents frontpage={false}/>
      </div>}
      <div className={classes.pomodoroTimerWidget} onClick={() => refocusOnIframe()}>
        <PomodoroWidget />
      </div>
    </div>
  </div>
}

const WalledGardenPortalBarComponent = registerComponent('WalledGardenPortalBar', WalledGardenPortalBar, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortalBar: typeof WalledGardenPortalBarComponent
  }
}
