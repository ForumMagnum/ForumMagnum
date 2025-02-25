import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { gatherTownURL } from "./GatherTownIframeWrapper";

const widgetStyling = {
  marginLeft: 30,
}

const gatherTownRightSideBarWidth = 300

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    marginBottom: 0,
    marginTop: 0,
    position: "relative",
  },
  widgetsContainer: {
    display: "flex",
    flexWrap: "wrap"
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
    width: 400,
    ...widgetStyling
  },
  pomodoroTimerWidget: {
    ...widgetStyling
  },
  codesList: {
    marginLeft: 60
  },
  calendarLinks: {
    fontSize: ".8em",
    marginTop: "3px"
  },
  events: {
    marginRight: 60
  },
  fbEventButton: {
    width: 135
  },
  textButton: {
    marginRight: 16,
    fontSize: "1rem",
    fontStyle: "italic"
  },
  calendars: {
    marginLeft: 60
  },
  link: {
    marginRight: 16,
    fontSize: "1rem",
    fontStyle: "italic",
    '& a': {
      color: theme.palette.grey[500]
    }
  }
})


export const WalledGardenPortalBar = ({iframeRef, classes}: {iframeRef: React.RefObject<HTMLIFrameElement|null>, classes: ClassesType<typeof styles>}) => {
  const { GardenCodeWidget, GardenCodesList, PomodoroWidget, Typography, ContentStyles } = Components

  const currentUser =  useCurrentUser()

  const refocusOnIframe = () => iframeRef?.current && iframeRef.current.focus()

  return <ContentStyles contentType="commentExceptPointerEvents" className={classes.root}>
    <div className={classes.widgetsContainer}>
      {currentUser?.walledGardenInvite && <div className={classes.events}>
        <Typography variant="title">Garden Events</Typography>
        <div className={classes.calendarLinks}>
          <div><GardenCodeWidget type="friend"/></div>
          <div><GardenCodeWidget type="event"/></div>
        </div>
      </div>}
      <div className={classes.eventWidget}>
        <GardenCodesList personal={false} />
        {currentUser?.walledGardenInvite && <GardenCodesList personal={true} />}
      </div>
      {currentUser?.walledGardenInvite && <div className={classes.calendars}>
        <div className={classes.textButton}>
          <a href={"https://www.facebook.com/groups/356586692361618/events"} target="_blank" rel="noopener noreferrer">
            Facebook Group
          </a>
        </div>
        <div className={classes.link}>
          <a href={gatherTownURL} rel="noopener noreferrer">
            Backup GatherTown Link
          </a>
        </div>
      </div>}
      <div className={classes.pomodoroTimerWidget} onClick={() => refocusOnIframe()}>
        <PomodoroWidget />
      </div>
    </div>
  </ContentStyles>
}

const WalledGardenPortalBarComponent = registerComponent('WalledGardenPortalBar', WalledGardenPortalBar, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortalBar: typeof WalledGardenPortalBarComponent
  }
}
