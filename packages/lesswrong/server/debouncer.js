/*global Vulcan*/
import { DebouncerEvents } from '../lib/collections/debouncerEvents/collection.js';
import { addCronJob } from './cronUtil.js';

let eventDebouncersByName = {};

// Defines a debouncable event type; that is, an event which, some time after
// it happens, causes a function call, with events grouped together into a
// single call. We store these events in the database, rather than use a simple
// callback function, because this happens over long time scales, the server
// might restart before the handler fires, and the handler might run on a
// different server than the event(s) was/were generated.
//
// Each debounced event has a name, which is used in the database to identify
// its type and the callback that will handle it. Event types are independent.
// Each debounced event also has a key (a JSON object); events with different
// keys are also independent. For example, when debouncing notifications to
// users, the key would contain a userId. Finally, each debounced event has
// eventData (a JSON object); events with different eventData are *not*
// independent, and the callback will receive an array containing the eventData
// for all of the grouped events.
//
// Within events that are grouped (ie, that share a name and a key), the way
// timing works is:
//  * When a debounced event happens, it goes into a "pending" state
//  * When the callback fires, it handles all pending events that share a name
//    and key, and moves them out of the pending the state
//  * A callback fires when either:
//    * It has been delayMinutes since the most recent event, or
//    * It has been maxDelayMinutes since the oldest event
//
// Constructor parameters:
//  * name: (String) - Used to identify this event type in the database. Must
//    be unique across EventDebouncers.
//  * delayMinutes: (Number)
//  * maxDelayMinutes: (Optional Number)
//  * callback: (key:JSON, events: Array[JSONObject])=>None
export class EventDebouncer
{
  constructor({ name, delayMinutes, maxDelayMinutes=null, callback }) {
    if (!name || !callback || !delayMinutes)
      throw new Error("EventDebouncer constructor: missing required argument");
    if (name in eventDebouncersByName)
      throw new Error(`Duplicate name for EventDebouncer: ${name}`);
    
    if (!maxDelayMinutes)
      maxDelayMinutes = delayMinutes;
    
    this.name = name;
    this.delayMinutes = delayMinutes;
    this.maxDelayMinutes = maxDelayMinutes;
    this.callback = callback;
    eventDebouncersByName[name] = this;
  }
  
  // Add a debounced event.
  //
  // Parameters:
  //  * name: (String)
  //  * key: (JSON)
  //  * eventData: (JSON)
  recordEvent = async (key, eventData) => {
    const now = new Date();
    const msPerMin = 60*1000;
    const newDelayTime = new Date(now.getTime() + (this.delayMinutes * msPerMin));
    const newUpperBoundTime = new Date(now.getTime() + (this.maxDelayMinutes * msPerMin));
    
    // On rawCollection because minimongo doesn't support $max/$min on Dates
    await DebouncerEvents.rawCollection().update({
      name: this.name,
      key: JSON.stringify(key),
      dispatched: false,
    }, {
      $max: { delayTime: newDelayTime.getTime() },
      $min: { upperBoundTime: newUpperBoundTime.getTime() },
      $push: {
        pendingEvents: eventData,
      }
    }, {
      upsert: true
    });
  }
  
  _dispatchEvent = async (key, events) => {
    try {
      //eslint-disable-next-line no-console
      console.log(`Handling ${events.length} grouped ${this.name} events`);
      
      await this.callback(key, events);
    } catch(e) {
      //eslint-disable-next-line no-console
      console.error(e);
    }
  };
}

const dispatchEvent = async (event) => {
  const eventDebouncer = eventDebouncersByName[event.name];
  if (!eventDebouncer) {
    // eslint-disable-next-line no-console
    throw new Error(`Unrecognized event type: ${event.name}`);
  }
  
  await eventDebouncer._dispatchEvent(JSON.parse(event.key), event.pendingEvents);
}

export const dispatchPendingEvents = async () => {
  const now = new Date().getTime();
  let eventToHandle = null;
  
  do {
    // Finds one grouped event that is ready to go, and marks it as handled in
    // the same operation (to prevent race conditions between multiple servers
    // checking for events at the same time).
    //
    // On rawCollection so that this doesn't get routed through Minimongo, which
    // doesn't support findOneAndUpdate.
    const queryResult = await DebouncerEvents.rawCollection().findOneAndUpdate(
      {
        dispatched: false,
        $or: [
          { delayTime: {$lt: now} },
          { upperBoundTime: {$lt: now} }
        ]
      },
      {
        $set: { dispatched: true }
      }
    );
    eventToHandle = queryResult.value;
    
    if (eventToHandle) {
      await dispatchEvent(eventToHandle);
    }
    
    // Keep checking for more events to handle so long as one was handled.
  } while (eventToHandle);
};

// Dispatch any pending debounced events, independent of their timers. You
// would do this interactively if you're testing and don't want to wait.
export const forcePendingEvents = async () => {
  let eventToHandle = null;
  
  do {
    const queryResult = await DebouncerEvents.rawCollection().findOneAndUpdate(
      { dispatched: false, },
      { $set: { dispatched: true } },
    );
    eventToHandle = queryResult.value;
    
    if (eventToHandle) {
      await dispatchEvent(eventToHandle);
    }
    
    // Keep checking for more events to handle so long as one was handled.
  } while (eventToHandle);
}
Vulcan.forcePendingEvents = forcePendingEvents;

addCronJob({
  name: "Debounced event handler",
  schedule(parser) {
    // Once per minute, on the minute
    return parser.cron('* * * * * *');
  },
  job() {
    dispatchPendingEvents();
  }
});