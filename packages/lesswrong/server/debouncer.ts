import { captureException } from '@sentry/core';
import { DebouncerEvents } from '../lib/collections/debouncerEvents/collection';
import { isAF, testServerSetting } from '../lib/instanceSettings';
import moment from '../lib/moment-timezone';
import { addCronJob } from './cron/cronUtil';
import { Vulcan } from '../lib/vulcan-lib/config';
import DebouncerEventsRepo from './repos/DebouncerEventsRepo';
import { isAnyTest } from '../lib/executionEnvironment';

let eventDebouncersByName: Partial<Record<string,EventDebouncer<any>>> = {};

type DebouncerCallback<KeyType> = (key: KeyType, events: string[]) => void | Promise<void>;

export type DebouncerTiming =
    { type: "none" }
  | { type: "delayed", delayMinutes: number, maxDelayMinutes?: number }
  | { type: "daily", timeOfDayGMT: number }
  | { type: "weekly", timeOfDayGMT: number, dayOfWeekGMT: string }

/**
 * Defines a debouncable event type; that is, an event which, some time after
 * it happens, causes a function call, with events grouped together into a
 * single call. We store these events in the database, rather than use a simple
 * callback function, because this happens over long time scales, the server
 * might restart before the handler fires, and the handler might run on a
 * different server than the event(s) was/were generated.
 *
 * Each debounced event has a name, which is used in the database to identify
 * its type and the callback that will handle it. Event types are independent.
 * Each debounced event also has a key (a JSON object); events with different
 * keys are also independent. For example, when debouncing notifications to
 * users, the key would contain a userId. Finally, each debounced event has
 * eventData (a string); events with different eventData are *not* independent,
 * and the callback will receive an array containing the eventData for all of
 * the grouped events.
 *
 * Within events that are grouped (ie, that share a name and a key), the way
 * timing works is:
 *  * When a debounced event happens, it goes into a "pending" state
 *  * When the callback fires, it handles all pending events that share a name
 *    and key, and moves them out of the pending state
 *  * A callback fires when either delayTime or upperBoundTime is passed
 *
 * There are several different possible timing rules. In some cases, these
 * correspond to user configuration, so different (name,key) pairs can have
 * different timing rules. A timing rule is an object with a string field "type"
 * plus other fields depending on the type. The possible timing rules are:
 *
 *   none:
 *     Events fire on the next cron-tick after they're added (up to 1min).
 *   delayed:
 *     * delayMinutes: number
 *     * maxDelayMinutes: number
 *     Events fire when either it has
 *     been delayMinutes since any event was added to the group, or
 *     maxDelayMinutes since the first event was added to the group
 *   daily:
 *     * timeOfDayGMT: number
 *     There is a day-boundary once per day, at timeOfDayGMT. Events fire
 *     when the current time and the oldest event in the group are on opposite
 *     sides of a day-boundary.
 *   weekly:
 *     * timeOfDayGMT: number
 *     * dayOfWeekGMT: string
 *     As daily, except that in addition to timeOfDayGMT there is also a
 *     dayOfWeekGMT, which is a string like "Saturday".
 *
 * The timing rule is specified when each event is being added. If an event
 * would be added to a group with a different timing rule, that group fires
 * according to whichever timing rule would make it fire soonest.
 *
 * Constructor parameters:
 *  * name: (String) - Used to identify this event type in the database. Must
 *    be unique across EventDebouncers.
 *  * defaultTiming: (Object, optional) - If an event is added with no timing
 *    rule specified, this timing rule is used. If this argument is omitted,
 *    then a timing rule is required when adding an event.
 *  * callback: (key:JSON, events: Array[JSONObject])=>None
 */
export class EventDebouncer<KeyType = string>
{
  name: string
  defaultTiming?: DebouncerTiming
  callback: DebouncerCallback<KeyType>

  constructor({ name, defaultTiming, callback }: {
    name: string,
    defaultTiming: DebouncerTiming,
    callback: DebouncerCallback<KeyType>,
  }) {
    if (!name || !callback)
      throw new Error("EventDebouncer constructor: missing required argument");
    if (name in eventDebouncersByName)
      throw new Error(`Duplicate name for EventDebouncer: ${name}`);
    
    this.name = name;
    this.defaultTiming = defaultTiming;
    this.callback = callback;
    eventDebouncersByName[name] = this;
  }
  
  // Add a debounced event.
  //
  // Parameters:
  //  * key: (JSON)
  //  * data: (JSON)
  //  * timing: (Object)
  //  * af: (bool)
  recordEvent = async ({key, data, timing=null, af=false}: {
    key: KeyType,
    data?: string,
    timing?: DebouncerTiming|null,
    af?: boolean,
  }) => {
    const timingRule = timing || this.defaultTiming;
    if (!timingRule) {
      throw new Error("EventDebouncer.recordEvent: missing timing argument and no defaultTiming set.");
    }
    const { newDelayTime, newUpperBoundTime } = this.parseTiming(timingRule);
    if (data !== undefined && typeof data !== "string") {
      throw new Error(`Invalid debouncer event data: ${data}`);
    }

    await new DebouncerEventsRepo().recordEvent(
      this.name,
      af,
      new Date(newDelayTime),
      new Date(newUpperBoundTime),
      JSON.stringify(key),
      data,
    );
  }

  parseTiming = (timing: DebouncerTiming) => {
    const now = new Date();
    const msPerMin = 60*1000;
    
    switch(timing.type) {
      default:
      case "none":
        return {
          newDelayTime: now,
          newUpperBoundTime: now
        }
      case "delayed":
        return {
          newDelayTime: new Date(now.getTime() + (timing.delayMinutes * msPerMin)),
          newUpperBoundTime: new Date(now.getTime() + ((timing.maxDelayMinutes||timing.delayMinutes) * msPerMin)),
        };
      case "daily":
        const nextDailyBatchTime = getDailyBatchTimeAfter(now, timing.timeOfDayGMT);
        return {
          newDelayTime: nextDailyBatchTime,
          newUpperBoundTime: nextDailyBatchTime,
        }
      case "weekly":
        const nextWeeklyBatchTime = getWeeklyBatchTimeAfter(now, timing.timeOfDayGMT, timing.dayOfWeekGMT);
        return {
          newDelayTime: nextWeeklyBatchTime,
          newUpperBoundTime: nextWeeklyBatchTime,
        }
    }
  }
  
  _dispatchEvent = async (key: KeyType, events: string[]|null) => {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log(`Handling ${events?.length} grouped ${this.name} events`);
    }
    await this.callback(key, events||[]);
  };
}

// Get the earliest time after now which matches the given time of day. Limited
// to one-minute precision.
export const getDailyBatchTimeAfter = (now: Date, timeOfDayGMT: number) => {
  let todaysBatch = moment(now).tz("GMT");
  todaysBatch.set('hour', Math.floor(timeOfDayGMT));
  todaysBatch.set('minute', 60*(timeOfDayGMT%1));
  todaysBatch.set('second', 0);
  todaysBatch.set('millisecond', 0);
  
  if (todaysBatch.isBefore(now)) {
    return moment(todaysBatch).add(1, 'days').toDate();
  } else {
    return todaysBatch.toDate();
  }
}

// Get the earliest time after now which matches the given time of day and day
// of the week. One-minute precision.
export const getWeeklyBatchTimeAfter = (now: Date, timeOfDayGMT: number, dayOfWeekGMT: string) => {
  const nextDailyBatch = moment(getDailyBatchTimeAfter(now, timeOfDayGMT)).tz("GMT");
  
  // Target day of the week, as an integer 0-6
  const nextDailyBatchDayOfWeekNum = nextDailyBatch.day();
  const targetDayOfWeekNum = moment().day(dayOfWeekGMT).day();
  const daysOfWeekDifference = ((targetDayOfWeekNum - nextDailyBatchDayOfWeekNum ) + 7) % 7;
  const nextWeeklyBatch = nextDailyBatch.add(daysOfWeekDifference, 'days');
  return nextWeeklyBatch.toDate();
}

const dispatchEvent = async (event: DbDebouncerEvents) => {
  const eventDebouncer = eventDebouncersByName[event.name];
  if (!eventDebouncer) {
    // eslint-disable-next-line no-console
    throw new Error(`Unrecognized event type: ${event.name}`);
  }
  
  await eventDebouncer._dispatchEvent(JSON.parse(event.key), event.pendingEvents);
}

export const dispatchPendingEvents = async () => {
  const now = new Date();
  let eventToHandle: any = null;
  
  do {
    // Finds one grouped event that is ready to go, and marks it as handled in
    // the same operation (to prevent race conditions between multiple servers
    // checking for events at the same time).
    //
    // On rawCollection so that this doesn't get routed through Minimongo, which
    // doesn't support findOneAndUpdate.
    const queryResult: any = await DebouncerEvents.rawCollection().findOneAndUpdate(
      {
        dispatched: false,
        af: isAF,
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
      try {
        await dispatchEvent(eventToHandle);
      } catch (e) {
        await DebouncerEvents.rawUpdateOne({
          _id: eventToHandle._id
        }, {
          $set: { failed: true }
        });
        captureException(new Error(`Exception thrown while handling debouncer event ${eventToHandle._id}: ${e}`));
        captureException(e);
      }
    }
    
    // Keep checking for more events to handle so long as one was handled.
  } while (eventToHandle);
};

/**
 * Given a Date, dispatch any pending debounced events that would fire on or
 * before then. If no date is given, dispatch any pending events, regardless of
 * their timer. You would do this interactively if you're testing and don't
 * want to wait.
 */
export const forcePendingEvents = async (
  {upToDate, delay}:
  {
    upToDate?: string,
    /** Delay between pending events in ms */
    delay?: number
  } = {}
) => {
  let eventToHandle = null;
  let countHandled = 0;
  // Default time condition is nothing
  let timeCondition: MongoSelector<DbDebouncerEvents> = {}
  if (upToDate) {
    const upToDateTime = new Date(upToDate);
    timeCondition = {
      $or: [
        { delayTime: { $lt: upToDateTime } },
        { upperBoundTime: { $lt: upToDateTime } },
      ]
    }
  }
  
  do {
    const queryResult = await DebouncerEvents.rawCollection().findOneAndUpdate(
      {
        dispatched: false,
        af: isAF,
        ...timeCondition,
      },
      { $set: { dispatched: true } },
    );
    eventToHandle = queryResult.value;
    
    if (eventToHandle) {
      await dispatchEvent(eventToHandle);
      countHandled++;
    }
    
    if (delay) {
      await sleepWithVariance(delay)
    }
    // Keep checking for more events to handle so long as one was handled.
  } while (eventToHandle);

  // eslint-disable-next-line no-console
  console.log(`Forced ${countHandled} pending event${countHandled === 1 ? "" : "s"}`);
}

Vulcan.forcePendingEvents = forcePendingEvents;

export const cronDebouncedEventHandler = addCronJob({
  name: "Debounced event handler",
  // Once per minute, on the minute
  cronStyleSchedule: '* * * * *',
  disabled: testServerSetting.get(),
  job() {
    void dispatchPendingEvents();
  }
});

function sleepWithVariance(ms: number)
{
  const variance = Math.sqrt(ms)
  const randomizedSleepTimeMs = Math.round(normalDistribution(ms, variance))
  return new Promise(resolve => setTimeout(resolve, randomizedSleepTimeMs));
}

// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
function normalDistribution(mean: number, variance: number) {
  let x=0, y=0
  while (x === 0) {
    x = Math.random(); //Converting [0,1) to (0,1)
  }
  while (y === 0) {
    y = Math.random();
  }
  const initialNormal = Math.sqrt( -2.0 * Math.log( x ) ) * Math.cos( 2.0 * Math.PI * y )
  return (initialNormal * variance) + mean
}
