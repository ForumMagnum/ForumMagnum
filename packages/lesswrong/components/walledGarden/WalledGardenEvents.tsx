import React, { useEffect, useState } from 'react'
import _uniqBy from 'lodash/uniqBy';
import { getCalendarEvents } from './gardenCalendar';
import moment from 'moment';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme) => ({
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
})

const WalledGardenEvents = ({classes}) => {
  const [ events, setEvents ] = useState<any>([])
  useEffect(() => {
    const eventsCallback = (events) => {
      setEvents(_uniqBy(events, 'summary'))
    }

    if (Meteor.isClient) {
      void getCalendarEvents(eventsCallback)
    }
  }, [])

  if (!(events.length > 0)) return null 
  
  return <div className={classes.secondaryInfo}>
    {events.slice(0,2).map((event,i)=><div key={`event-${i}`}>
      <span>
        {event.summary}{" "}
        <span className={classes.eventTime}>{moment(new Date(event.start.dateTime)).calendar()}</span>
      </span>
    </div>)}
  </div>
}


const WalledGardenEventsComponent = registerComponent('WalledGardenEvents', WalledGardenEvents, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenEvents: typeof WalledGardenEventsComponent
  }
}
