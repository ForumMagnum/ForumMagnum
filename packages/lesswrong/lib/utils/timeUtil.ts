import moment from '../moment-timezone';

// Given a time of day (number of hours, 0-24), a day of the week (string or
// number 0-6), and a pair of timezones, convert the time/day to the new time
// zone.
export const convertTimeOfWeekTimezone = (timeOfDay, dayOfWeek, fromTimezone, toTimezone) => {
  if (!timeOfDay) throw Error("convertTimeOfWeekTimezone was not provided a timeOfDay")
  if (!dayOfWeek) throw Error("convertTimeOfWeekTimezone was not provided a dayOfWeek")
  if (!fromTimezone) throw Error("convertTimeOfWeekTimezone was not provided a fromTimezone")
  if (!toTimezone) throw Error("convertTimeOfWeekTimezone was not provided a toTimezone")

  let time = moment()
    .tz(fromTimezone)
    .day(dayOfWeek).hour(timeOfDay).minute(0)
    .tz(toTimezone);
  return {
    timeOfDay: time.hour(),
    dayOfWeek: time.format("dddd")
  };
}
