import React, { useState } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { Button, Typography} from "@material-ui/core";
import {commentBodyStyles, postBodyStyles} from "../../themes/stylePiping";
import {useTracking} from "../../lib/analyticsEvents";
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from "../../lib/vulcan-users";
import { useCurrentUser } from '../common/withUser';
import { KeyboardArrowUp, KeyboardArrowDown } from '@material-ui/icons';
import {CAL_ID} from "./gardenCalendar";

const widgetStyling = {
  width: "450px",
  marginLeft: "30px",
  marginTop: "25px"
}

const styles = (theme) => ({
  root: {
    ...commentBodyStyles(theme)
  },
  portalBarButton: {
    position: "absolute",
    left: "40%",
    marginTop: "-20px"
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
  pomodoroTimerIframe: {
    width: "450px",
    height: "300px",
    marginTop: "5px"
  },
  body: {
    display: "flex",
    justifyContent: "space-evenly"
  },
  calendarLinks: {
    fontSize: ".8em",
    // fontStyle: "italic",
    marginTop: "3px"
  }
})

export const WalledGardenPortalBar = ({classes}:{classes:ClassesType}) => {
  const { GardenCodeWidget, WalledGardenEvents, PomodoroWidget } = Components

  const currentUser =  useCurrentUser()
  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  })

  const { captureEvent } = useTracking()

  const [hideBar, setHideBar] = useState(false) //currentUser?.hideWalledGardenPortalBar||false)


  if (!currentUser) return null
  const chevronStyle = {fontSize: 50}
  const icon =  hideBar ? <KeyboardArrowUp style={chevronStyle}/> : <KeyboardArrowDown style={chevronStyle}/>

  return <div className={classes.root}>
    <Button className={classes.portalBarButton} onClick={ async () => {
      setHideBar(!hideBar);
      void updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideWalledGardenPortalBar: !hideBar
        },
      })
    }}>
      { icon }
    </Button>

    {!hideBar && <div className={classes.body}>
      <div className={classes.gardenCodeWidget}>
        <GardenCodeWidget/>
      </div>
      <div className={classes.eventWidget}>
        <Typography variant="title">Upcoming Events</Typography>
        <WalledGardenEvents frontpage={false}/>
        <div className={classes.calendarLinks}>
          <div><a href={`https://calendar.google.com/calendar/u/0?cid=${CAL_ID}`} target="_blank">View All Events (Gcal)</a></div>
          <div><a href={"https://www.facebook.com/groups/356586692361618/events"} target="_blank">FB Group Events</a></div>
          <div><a href={"https://www.facebook.com/events/create/?group_id=356586692361618"} target="_blank">Create Event (FB)</a></div>
        </div>
      </div>
      <div className={classes.pomodoroTimerWidget}>
        <PomodoroWidget/>
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

