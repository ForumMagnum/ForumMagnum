import React from 'react'
import moment from 'moment';
import {registerComponent, Components } from '../../lib/vulcan-lib';
import { getUrlClass } from '../../lib/routeUtil';

const styles = (theme) => ({
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
  }
})


export const getAddToCalendarLink = (gcalEvent) => {
  const { LWTooltip } = Components
  
  const UrlClass = getUrlClass()
  const url = new UrlClass(gcalEvent.htmlLink)
  const eid = url.searchParams.get("eid")
  const addToCalendarLink = `https://calendar.google.com/event?action=TEMPLATE&tmeid=${eid}&tmsrc=${gcalEvent.organizer.email}`
  const link = <a href={addToCalendarLink} target="_blank" rel="noopener noreferrer">
    {gcalEvent.summary}
  </a>

  if (gcalEvent.description) {
    return <LWTooltip title={<div dangerouslySetInnerHTML={{__html:gcalEvent.description}}/>}>
      {link}
    </LWTooltip>
  } else {
    return link
  }
}

const PortalBarGcalEventItem = ({classes, gcalEvent}) => {

  return <div className={classes.root}>
      {getAddToCalendarLink(gcalEvent)}
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
