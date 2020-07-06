import { useCreate } from '../crud/withCreate';
import React, { useState, useEffect } from 'react';
import uuid from 'uuid/v4';
import { hookToHoc } from '../../lib/hocUtils';
import * as _ from 'underscore';

export const useNewEvents = () => {
  const [events, setEvents] = useState<any>({});
  const {create: createLWEvent} = useCreate({
    collectionName: "LWEvents",
    fragmentName: "newEventFragment",
  });
  
  const recordEvent = (name: string, closeOnLeave: boolean, properties: any): string => {
    const { userId, documentId, important, intercom, ...rest} = properties;
    let event = {
      userId,
      name,
      documentId,
      important,
      properties: {
        startTime: new Date(),
        ...rest,
      },
      intercom,
    };
    const eventId = uuid();
    
    if (closeOnLeave) {
      setEvents({ ...events, eventId: event });
    }
    
    createLWEvent({data: event});
    return eventId;
  }
  
  const closeEvent = (eventId: string, properties:any={}): string => {
    let event = events[eventId];
    let currentTime = new Date();
    
    createLWEvent({data: {
      ...event,
      properties: {
        endTime: currentTime,
        duration: currentTime.valueOf() - event.properties.startTime.valueOf(),
        ...event.properties,
        ...properties,
      },
    }});
    
    setEvents(_.omit(events, eventId));
    return eventId;
  }
  
  const closeAllEvents = () => {
    Object.keys(events).forEach(key => {
      closeEvent(key);
    });
    setEvents({});
  };
  
  const onUnmount = () => {
    Object.keys(events).forEach(key => {
      closeEvent(key);
    });
  }
  
  useEffect(() => onUnmount);
  
  return {recordEvent, closeAllEvents};
}

export const withNewEvents = hookToHoc(useNewEvents);

export default withNewEvents;
