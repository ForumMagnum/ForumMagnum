import React, { useContext } from 'react';
import moment from '../moment-timezone';

export interface TimeOverride {
  currentTime: Date|null;
}
export const TimeContext = React.createContext<TimeOverride>({currentTime: null});

// useCurrentTime: If we're rehydrating a server-side render, returns the
// time the SSR was prepared. If we're preparing an SSR, returns the time the
// SSR was started. Otherwise return the current wall-clock time.
// (This switch will not cause components to rerender during pageload.)
//
// The motivation for this is to prevent SSR mismatches caused by the time
// that passes in between when the server renders a page, and when the client
// hydrates the page into React. Components that display dates can use this as
// a drop-in replacement for `new Date()` or `moment()` and should do so any
// time they use the current time in a way that affects the HTML they return.
// (This isn't necessary inside of event handlers or in any context that
// isn't a component or used by components.)
export function useCurrentTime(): Date {
  const time = useContext(TimeContext);
  if (time?.currentTime) {
    return time.currentTime;
  } else {
    return new Date();
  }
}

export const useSsrRenderedAt = () => {
  const currentTime = useCurrentTime();
  return typeof window === "undefined"
    ? currentTime
    : new Date(window.ssrRenderedAt);
}

// Given a time of day (number of hours, 0-24), a day of the week (string or
// number 0-6), and a pair of timezones, convert the time/day to the new time
// zone.
export const convertTimeOfWeekTimezone = (timeOfDay: number, dayOfWeek: string|number, fromTimezone: string, toTimezone: string) => {
  let time = moment()
    .tz(fromTimezone)
    .day(dayOfWeek).hour(timeOfDay).minute(0)
    .tz(toTimezone);
  return {
    timeOfDay: time.hour(),
    dayOfWeek: time.format("dddd") as "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday"
  };
}

export function isInFuture(when: Date): boolean {
  return when > new Date();
}
