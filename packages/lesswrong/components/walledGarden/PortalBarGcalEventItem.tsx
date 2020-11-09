import React from 'react'
import moment from 'moment';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
    fontSize: '1.1rem',
    color: 'rgba(0,0,0,0.55)',
    display: "flex",
    justifyContent: "space-between"
  },
  eventTime: {
    fontSize: ".9em",
    opacity: .75,
    width: 120,
    textAlign: "right",
    display: "inline-block"
  },
  tooltip: {
    whiteSpace: "pre-wrap"
  }
})

const PortalBarGcalEventItem = ({classes, gcalEvent}: {
  classes: ClassesType,
  gcalEvent: any,
}) => {
  const { LWTooltip } = Components

  const urlParams = new URLSearchParams(gcalEvent.htmlLink.split('?')[1])
  const eid = urlParams.get("eid")
  const addToCalendarLink = `https://calendar.google.com/event?action=TEMPLATE&tmeid=${eid}&tmsrc=${gcalEvent.organizer.email}`
  const link = <a href={addToCalendarLink} target="_blank" rel="noopener noreferrer">
    {gcalEvent.summary}
  </a>

  return <div className={classes.root}>
      {gcalEvent.description ?
        <LWTooltip title={<div className={classes.tooltip}>{gcalEvent.description}</div>}>
          {link}
        </LWTooltip>
      : link}
      <span className={classes.eventTime}>
        {moment(new Date(gcalEvent.start.dateTime)).format("ddd h:mma, M/D")}
      </span>
    </div>
}


const PortalBarGcalEventItemComponent = registerComponent('PortalBarGcalEventItem', PortalBarGcalEventItem, {styles});

declare global {
  interface ComponentTypes {
    PortalBarGcalEventItem: typeof PortalBarGcalEventItemComponent
  }
}
