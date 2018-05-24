import { addCallback } from 'meteor/vulcan:core';
import intercomClient from './server.js';


function sendIntercomEvent (event, user) {
  if (user && event && event.intercom) {
    // Append documentId to metadata passed to intercom
    event.properties = {
      ...event.properties,
      documentId: event.documentId,
    }
    // console.log(event);
    let currentTime = new Date();
    let intercomEvent = {
      event_name: event.name,
      created_at: Math.floor((currentTime.getTime()/1000)),
      user_id: user._id,
      metadata: event.properties
    };
    intercomClient.events.create(intercomEvent);
  }
}

addCallback('lwevents.new.async', sendIntercomEvent);
