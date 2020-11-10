import React from 'react'
import moment from 'moment';
import {registerComponent, Components } from '../../lib/vulcan-lib';
import { getUrlClass } from '../../lib/routeUtil';

export const eventName = theme => ({
  ...theme.typography.commentStyle,
  fontSize: '1.1rem',
  color: 'rgba(0,0,0,0.55)',
  display: "flex",
  justifyContent: "space-between"
})

export const eventTime = theme => ({
  fontSize: ".9em",
  opacity: .75,
  width: 120,
  textAlign: "right",
  display: "inline-block"
})

export const eventFormat = (startTime) => {
  return moment(new Date(startTime)).format("ddd h:mma, M/D")
}

const styles = (theme) => ({
  root: {
    ...eventName
  },
  eventTime: {
    ...eventTime
  },
  tooltip: {
    whiteSpace: "pre-wrap"
  }
})

const UrlClass = getUrlClass()

const PortalBarGcalEventItem = ({classes, gcalEvent}) => {
  const { LWTooltip } = Components

  const url = new UrlClass(gcalEvent.htmlLink)
  const eid = url.searchParams.get("eid")
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
        {eventFormat(gcalEvent.start.dateTime)}
      </span>
    </div>
}


const PortalBarGcalEventItemComponent = registerComponent('PortalBarGcalEventItem', PortalBarGcalEventItem, {styles});

declare global {
  interface ComponentTypes {
    PortalBarGcalEventItem: typeof PortalBarGcalEventItemComponent
  }
}
