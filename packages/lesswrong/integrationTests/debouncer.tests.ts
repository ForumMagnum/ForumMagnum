import "./integrationTestSetup";
import lolex from 'lolex';
import { EventDebouncer, dispatchPendingEvents, getDailyBatchTimeAfter, getWeeklyBatchTimeAfter } from '../server/debouncer';
import { DebouncerEvents } from '../lib/collections/debouncerEvents/collection';

describe('EventDebouncer', () => {
  it('groups events correctly', async () => {
    let clock = lolex.install({
      now: new Date("1980-01-01"),
      shouldAdvanceTime: true,
    });
    
    try {
      // Clear the DebouncerEvents table
      await DebouncerEvents.rawRemove({});
      
      let numEventsHandled = 0;
      let numEventBatchesHandled = 0;
      const eventsHandled: Partial<Record<string,Record<string,number>>> = {}; // key=>event=>number of times seen
      const testEvent = new EventDebouncer({
        name: "testEvent",
        defaultTiming: {
          type: "delayed",
          delayMinutes: 15,
          maxDelayMinutes: 30,
        },
        callback: (key: string, events: Array<string>) => {
          numEventBatchesHandled++;
          events.forEach((ev: string) => {
            numEventsHandled++;
            
            if (!(key in eventsHandled))
              eventsHandled[key] = {};
            if (!(ev in eventsHandled[key]!))
              eventsHandled[key]![ev] = 0
            eventsHandled[key]![ev]++;
          });
        }
      });
      
      clock.setSystemTime(new Date("1980-01-01 00:01:00"));
      await testEvent.recordEvent({key: "firstKey", data: "1"});
      await testEvent.recordEvent({key: "firstKey", data: "2"});
      await testEvent.recordEvent({key: "secondKey", data: "3"});
      
      // Advance clock, but not enough for events to fire
      clock.setSystemTime(new Date("1980-01-01 00:14:00"));
      await dispatchPendingEvents();
      (eventsHandled as any).should.deep.equal({});
      
      // Advance clock, enough for events to fire
      clock.setSystemTime(new Date("1980-01-01 00:17:00"));
      await dispatchPendingEvents();
      (numEventBatchesHandled as any).should.equal(2);
      (numEventsHandled as any).should.equal(3);
      (eventsHandled.firstKey as any).should.deep.equal({
        "1": 1,
        "2": 1,
      });
      (eventsHandled.secondKey as any).should.deep.equal({
        "3": 1,
      });
      
      // Record another event, make sure it doesn't group together with already
      // fired events.
      clock.setSystemTime(new Date("1980-01-01 00:20:00"));
      await testEvent.recordEvent({key: "firstKey", data: "4"});
      await dispatchPendingEvents();
      (numEventsHandled as any).should.equal(3);
      
      // Add events to delay event release until maxDelayMinutes reached
      clock.setSystemTime(new Date("1980-01-01 00:30:00"));
      await testEvent.recordEvent({key: "firstKey", data: "5"});
      await dispatchPendingEvents();
      clock.setSystemTime(new Date("1980-01-01 00:40:00"));
      await testEvent.recordEvent({key: "firstKey", data: "6"});
      await dispatchPendingEvents();
      (numEventsHandled as any).should.equal(3);
      
      clock.setSystemTime(new Date("1980-01-01 00:51:00"));
      await dispatchPendingEvents();
      (numEventsHandled as any).should.equal(6);
    } finally {
      clock.uninstall();
    }
  });
  it('times daily batches correctly', async () => {
    getDailyBatchTimeAfter(new Date("1980-01-01 00:20:00Z"), 3).toString().should.equal(new Date("1980-01-01 03:00:00Z").toString());
    getDailyBatchTimeAfter(new Date("1980-01-01 05:20:00Z"), 3).toString().should.equal(new Date("1980-01-02 03:00:00Z").toString());
  });
  it('times weekly batches correctly', async () => {
    getWeeklyBatchTimeAfter(new Date("1980-01-01 00:20:00Z"), 3, "Friday").toString().should.equal(new Date("1980-01-04 03:00:00Z").toString());
    getWeeklyBatchTimeAfter(new Date("1980-01-01 00:20:00Z"), 3, "Tuesday").toString().should.equal(new Date("1980-01-01 03:00:00Z").toString());
    getWeeklyBatchTimeAfter(new Date("1980-01-01 03:20:00Z"), 3, "Tuesday").toString().should.equal(new Date("1980-01-08 03:00:00Z").toString());
  });
});
