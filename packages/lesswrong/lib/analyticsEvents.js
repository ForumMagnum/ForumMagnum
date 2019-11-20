/*global Vulcan*/

// AnalyticsUtil: An object/namespace full of functions which need to bypass
// the normal import system, because they are client- or server-specific but
// are used by code which isn't.
export const AnalyticsUtil = {
  // clientWriteEvents: Send a graphQL mutation from the client to the server
  // with an array of events. Available only on the client and when the react
  // tree is mounted, null otherwise; filled in by Components.AnalyticsClient.
  clientWriteEvents: null,
  
  // clientContextVars: A dictionary of variables that will be added to every
  // analytics event sent from the client. Client-side only.
  clientContextVars: {},
  
  // serverWriteEvent: Write a (single) event to the analytics database. Server-
  // side only, filled in in analyticsWriter.js; null on the client. If no
  // analytics database is configured, does nothing.
  serverWriteEvent: null,
};

export function captureEvent(eventType, eventProps) {
  try {
    if (Meteor.isServer) {
      // If run from the server, put this directly into the server's write-to-SQL
      // queue.
      AnalyticsUtil.serverWriteEvent({
        type: eventType,
        ...eventProps
      });
    } else if (Meteor.isClient) {
      // If run from the client, make a graphQL mutation
      pendingAnalyticsEvents.push({
        type: eventType,
        ...(Meteor.isClient ? AnalyticsUtil.clientContextVars : null),
        ...eventProps,
      });
      throttledFlushClientEvents();
    }
  } catch(e) {
    console.error("Error while capturing analytics event: ", e); //eslint-disable-line
  }
}

Vulcan.captureEvent = captureEvent;

let pendingAnalyticsEvents = [];

function flushClientEvents() {
  if (!AnalyticsUtil.clientWriteEvents)
    return;
  
  AnalyticsUtil.clientWriteEvents(pendingAnalyticsEvents.map(event => ({
    ...(Meteor.isClient ? AnalyticsUtil.clientContextVars : null),
    ...event
  })));
  pendingAnalyticsEvents = [];
}
const throttledFlushClientEvents = _.throttle(flushClientEvents, 1000);

