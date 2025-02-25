import React from 'react'
import moment from 'moment';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { getUrlClass } from '@/server/utils/getUrlClass';

export const eventRoot = (theme: ThemeType) => ({
  ...theme.typography.commentStyle,
  fontSize: '1.1rem',
  color: theme.palette.text.dim55,
  display: "flex",
  width: 350,
  [theme.breakpoints.down('xs')]: {
    width: "100%",
    flexWrap: "wrap",
  }
})

export const eventName = (theme: ThemeType) => ({
  width: 230,
  [theme.breakpoints.down('xs')]: {
    width: "100%",
    marginRight: 8,
  },
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "inline-block",
  whiteSpace: "nowrap"
})

export const eventTime = (theme: ThemeType) => ({
  fontSize: ".9em",
  opacity: .75,
  width: 150,
  [theme.breakpoints.down('xs')]: {
    width: "100%",
    textAlign: "left"
  },
  textAlign: "right",
  display: "inline-block"
})

export const eventFormat = (startTime: AnyBecauseTodo) => {
  return moment(new Date(startTime)).format("ddd h:mma, MMM D")
}

const styles = (theme: ThemeType) => ({
  root: {
    ...eventRoot(theme)
  },
  eventName: {
    ...eventName(theme)
  },
  eventTime: {
    ...eventTime(theme)
  },
})


export const getAddToCalendarLink = (gcalEvent: AnyBecauseTodo) => {
  const { LWTooltip } = Components
  
  const UrlClass = getUrlClass()
  const url = new UrlClass(gcalEvent.htmlLink)
  const eid = url.searchParams.get("eid")
  const addToCalendarLink = `https://calendar.google.com/event?action=TEMPLATE&tmeid=${eid}&tmsrc=${gcalEvent.organizer.email}`
  const link = <a href={addToCalendarLink} target="_blank" rel="noopener noreferrer">
    {gcalEvent.summary}
  </a>

  const noHtmlDescription = gcalEvent.description ? gcalEvent.description.replace(/<[^>]*>?/gm, '') : ""

  if (gcalEvent.description) {
    return <LWTooltip title={<div style={{whiteSpace: "pre-wrap"}}>{noHtmlDescription}</div>}>
      {link}
    </LWTooltip>
  } else {
    return link
  }
}

const PortalBarGcalEventItem = ({classes, gcalEvent}: {
  classes: ClassesType<typeof styles>,
  gcalEvent: any,
}) => {
  return <div className={classes.root}>
      <span className={classes.eventName}>
        {getAddToCalendarLink(gcalEvent)}
      </span>
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
