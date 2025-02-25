import React, { useEffect, useState } from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

// this component is no longer used. 
// TODO: after making sure that we want to retire the google-calendar based event system, remove this component from the codebase.

const WalledGardenEvents = ({frontpage=true}) => {
  const { FrontpageGcalEventItem, PortalBarGcalEventItem } = Components

  const [ events, setEvents ] = useState<any>([])
  useEffect(() => {
    // const eventsCallback = (events) => {
    //   setEvents(_uniqBy(events, 'summary'))
    // }

    // Disabling broken code in unused component
    // if (Meteor.isClient) {
    //   void getCalendarEvents(eventsCallback)
    // }
  }, [])


  const limit = frontpage ? 2 : 8
  if (!(events.length > 0)) return null

  return <div>
    { events.slice(0,limit).map((event: AnyBecauseTodo,i: number)=> frontpage ?
      <FrontpageGcalEventItem key={`event-${i}`} gcalEvent={event}/>
      : <PortalBarGcalEventItem key={`event-${i}`} gcalEvent={event}/>
    )}
  </div>
}


const WalledGardenEventsComponent = registerComponent('WalledGardenEvents', WalledGardenEvents);

declare global {
  interface ComponentTypes {
    WalledGardenEvents: typeof WalledGardenEventsComponent
  }
}
