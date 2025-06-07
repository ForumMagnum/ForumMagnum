import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { hookToHoc } from '../../lib/hocUtils';
import * as _ from 'underscore';
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const newEventFragmentMutation = gql(`
  mutation createLWEventwithNewEvents($data: CreateLWEventDataInput!) {
    createLWEvent(data: $data) {
      data {
        ...newEventFragment
      }
    }
  }
`);

export const useNewEvents = () => {
  const [events, setEvents] = useState<any>({});
  const [createLWEvent] = useMutation(newEventFragmentMutation, {
    ignoreResults: true,
  });
  
  const recordEvent = useCallback((name: string, closeOnLeave: boolean, properties: any): string => {
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
    
    void createLWEvent({ variables: { data: event } });
    return eventId;
  }, [events, createLWEvent]);
  
  const closeEvent = useCallback((eventId: string, properties: any={}): string => {
    let event = events[eventId];
    let currentTime = new Date();
    
    void createLWEvent({
      variables: {
        data: {
          ...event,
          properties: {
            endTime: currentTime,
            duration: currentTime.valueOf() - event.properties.startTime.valueOf(),
            ...event.properties,
            ...properties,
          },
        }
      }
});
    
    setEvents(_.omit(events, eventId));
    return eventId;
  }, [events, createLWEvent]);
  
  const closeAllEvents = useCallback(() => {
    Object.keys(events).forEach(key => {
      closeEvent(key);
    });
    setEvents({});
  }, [events, closeEvent]);
  
  const onUnmount = useCallback(() => {
    Object.keys(events).forEach(key => {
      closeEvent(key);
    });
  }, [events, closeEvent]);
  
  useEffect(() => onUnmount(), [onUnmount]);
  
  return {recordEvent, closeAllEvents};
}

export const withNewEvents = hookToHoc(useNewEvents);

export default withNewEvents;
