'use client';
import React from 'react';
import moment from '../moment-timezone';
import { useCurrentTime } from './TimeProvider';

export const DEFAULT_TIMEZONE = "GMT";

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { useCurrentTime };

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
