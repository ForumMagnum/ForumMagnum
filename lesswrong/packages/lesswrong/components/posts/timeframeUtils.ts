import moment from '../../lib/moment-timezone';
import * as _ from 'underscore';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';

export const timeframes = ["daily", "weekly", "monthly", "yearly"] as const;
export const timeframeSettings = ["allTime", ...timeframes, "exponential"] as const;
export type TimeframeType = typeof timeframes[number];
export type TimeframeSettingType = typeof timeframeSettings[number];

export const timeframeLabels: Record<TimeframeSettingType,SettingsOption> = {
  allTime:     { label: 'All time' },
  daily:       { label: 'Daily' },
  weekly:      { label: 'Weekly' },
  monthly:     { label: 'Monthly' },
  yearly:      { label: 'Yearly' },
  exponential: { label: "Exponential" },
}

export const timeframeToTimeBlock: Record<TimeframeType,moment.unitOfTime.DurationAs> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
}

export const loadMoreTimeframeMessages = {
  'daily': 'Load More Days',
  'weekly': 'Load More Weeks',
  'monthly': 'Load More Months',
  'yearly': 'Load More Years',
}

// Locally valid. Moment supports seconds, but that's not how these functions
// work.
type TimeBlockString = moment.unitOfTime.DurationAs
const VALID_TIME_BLOCKS: Array<TimeBlockString> = [
  'days', 'day',
  'weeks', 'week',
  'months', 'month',
  'years', 'year',
]

// Return a date string for each date which should have a section, in
// descending order.
//
// Dates must be in YYYY-MM-DD format. before is exclusive.
//
// This is timezone agnostic. For (2019-01-01, 2019-01-03, 'day') it will return
// 2019-01-02, 2019-01-01, all as strings without regard to any notion of
// timezone. It pretends that everything's in UTC for date-parsing (used for
// date-math), but this is just a convenient fiction that doesn't effect the
// result.
export function getDateRange (after: string|Date, before: string|Date, timeBlock: TimeBlockString) {
  // true for strict parsing
  const mAfter = moment.utc(after, 'YYYY-MM-DD', true)
  const mBefore = moment.utc(before, 'YYYY-MM-DD', true)
  if (!mAfter.isValid()) {
    throw new Error(`Invalid after '${after}', expected 'YYYY-MM-DD'`)
  }
  if (!mBefore.isValid()) {
    throw new Error(`Invalid before '${before}', expected 'YYYY-MM-DD'`)
  }
  if (!VALID_TIME_BLOCKS.includes(timeBlock)) {
    throw new Error(`Invalid timeBlock '${timeBlock}'`)
  }
  // true for decimal result
  const rawDiff = mBefore.diff(mAfter, timeBlock, true)
  if (rawDiff < 0) {
    throw new Error(`getDateRange got after date (${after}) after the before date (${before})`)
  }
  if (rawDiff % 1 !== 0) {
    // eslint-disable-next-line no-console
    console.warn(`getDateRange: dates ${after}, ${before} are not an integer number of ${timeBlock}s apart`)
    // No return, ceil the value and return a range that goes before the
    // after
  }
  const numTimeBlocks = Math.ceil(rawDiff)
  const greatestDateInRange = mBefore.subtract(1, timeBlock)
  return _.range(numTimeBlocks).map(
    i => greatestDateInRange.clone()
      .subtract(i, timeBlock)
      .format('YYYY-MM-DD')
  )
}

// Calculates the initial value for after, as used by PostsTimeframeList
//
// Will always land on the boundary of the timeBlock, as determined by moment's
// startOf function. If you wanted to posts for the past 3 weeks, you'd call
// this with ({numTimeBlocks: 3, timeBlock: 'week'). You would then go to the
// most recent Sunday, and then two Sundays before that.
export function getAfterDefault ({numTimeBlocks, timeBlock, timezone, before}: {
  numTimeBlocks: number,
  timeBlock: TimeBlockString,
  timezone: string,
  before?: string,
}) {
  if (!numTimeBlocks || !timeBlock || !timezone) throw new Error("Missing argument in getAfterDefault");
  const startCurrentTimeBlock = moment(before).tz(timezone).startOf(timeBlock)
  return startCurrentTimeBlock.subtract(numTimeBlocks - 1, timeBlock).format('YYYY-MM-DD')
}

// Calculates the initial value for before, as used by PostsTimeframeList. Note that
// it is used as an exclusive boundary.
//
// For ease of calculations, we start at the beginning of the next timeBlock.
// i.e. if today is July 10th, the default 'before' date is August 1st.
export function getBeforeDefault ({timeBlock, timezone, after}: {
  timeBlock: TimeBlockString,
  timezone: string,
  after?: string,
}) {
  if (!timeBlock) throw new Error("Missing argument in getBeforeDefault");
  const startNextTimeBlock = moment(after).tz(timezone).startOf(timeBlock).add(after ? 3 : 1, timeBlock)
  return startNextTimeBlock.format('YYYY-MM-DD')
}

export function timeframeToRange({startDate, timeBlock, timezone}: {
  startDate: moment.Moment,
  timeBlock: moment.unitOfTime.DurationAs,
  timezone: string,
}) {
  return {
    after: moment.tz(startDate, timezone).startOf(timeBlock),
    before: moment.tz(startDate, timezone).endOf(timeBlock),
  }
}
