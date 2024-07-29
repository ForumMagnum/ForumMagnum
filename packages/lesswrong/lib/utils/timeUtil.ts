import React, { useContext } from 'react';
import moment from '../moment-timezone';

export const DEFAULT_TIMEZONE = "GMT";

export type SSRMetadata = {
  /** ISO timestamp */
  renderedAt: string;
  cacheFriendly: boolean;
  /** The timezone used on the server. This may differ from the client's timezone if this is a cached render */
  timezone: string;
}

export type EnvironmentOverride = Partial<SSRMetadata> & {
  matchSSR: boolean;
}
export const EnvironmentOverrideContext = React.createContext<EnvironmentOverride>({matchSSR: true});

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
  const { renderedAt } = useContext(EnvironmentOverrideContext);
  if (renderedAt) {
    return new Date(renderedAt);
  } else {
    return new Date();
  }
}

export const useSsrRenderedAt = () => {
  const currentTime = useCurrentTime();
  return typeof window === "undefined" || !window.ssrMetadata
    ? currentTime
    : new Date(window.ssrMetadata.renderedAt);
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

/**
 * Convert from e.g. 1d to "1 day"
 */
export function relativeTimeToLongFormat(time: string): string {
  if (time === 'now') {
      return 'a few seconds';
  }

  const timeUnit = time.slice(time.search(/\D/));
  const timeValue = parseInt(time.slice(0, -1));

  switch(timeUnit) {
      case 's':
          return timeValue + ' second' + (timeValue > 1 ? 's' : '');
      case 'm':
          return timeValue + ' minute' + (timeValue > 1 ? 's' : '');
      case 'h':
          return timeValue + ' hour' + (timeValue > 1 ? 's' : '');
      case 'd':
          return timeValue + ' day' + (timeValue > 1 ? 's' : '');
      case 'mo':
          return timeValue + ' month' + (timeValue > 1 ? 's' : '');
      case 'y':
          return timeValue + ' year' + (timeValue > 1 ? 's' : '');
      default:
          return time;
  }
}
