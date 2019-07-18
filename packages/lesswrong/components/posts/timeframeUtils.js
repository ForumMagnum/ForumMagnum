import moment from 'moment';

// Locally valid. Moment supports seconds, but that's not how these functions
// work
const VALID_TIME_BLOCKS = [
  'days', 'day',
  'weeks', 'week',
  'months', 'month',
  'years', 'year',
]

// Return a date string for each date which should have a section. This
// includes all dates in the range, in descending order.
//
// Dates must be in YYYY-MM-DD format
// TODO; timeblock + doc
//
// This is timezone agnostic. For (2019-01-01, 2019-01-03, 'day') it will return
// 2019-01-03, 2019-01-02, 2019-01-01, all as strings without regard to any
// notion of timezone. It pretends that everything's in UTC for date-parsing
// (used for date-math), but this is just a convenient fiction that doesn't
// effect the result.
export function getDateRange (startDate, endDate, timeBlock) {
  // true for strict parsing
  const mStartDate = moment.utc(startDate, 'YYYY-MM-DD', true)
  const mEndDate = moment.utc(endDate, 'YYYY-MM-DD', true)
  if (!mStartDate.isValid()) {
    throw new Error(`Invalid startDate '${startDate}', expected 'YYYY-MM-DD'`)
  }
  if (!mEndDate.isValid()) {
    throw new Error(`Invalid endDate '${endDate}', expected 'YYYY-MM-DD'`)
  }
  if (!VALID_TIME_BLOCKS.includes(timeBlock)) {
    throw new Error(`Invalid timeBlock '${timeBlock}'`)
  }
  // true for decimal result
  const rawDiff = mEndDate.diff(mStartDate, timeBlock, true)
  if (rawDiff < 0) {
    throw new Error(`getDateRange got a startDate (${startDate}) after the endDate (${endDate})`)
  }
  if (rawDiff % 1 !== 0) {
    // eslint-disable-next-line no-console
    console.warn(`getDateRange: dates ${startDate}, ${endDate} are not exactly N ${timeBlock}s apart`)
    // No return, ceil the value and return a range that goes before the
    // startDate
  }
  // +1 for fenceposts
  const numTimeBlocks = Math.ceil(rawDiff) + 1
  return _.range(numTimeBlocks).map(
    i => mEndDate.clone()
      .subtract(i, timeBlock)
      .format('YYYY-MM-DD')
  )
}

// TODO; doc
// TODO; test

export function getAfterDateDefault (numTimeBlocks, timeBlock) {
  if (!numTimeBlocks || !timeBlock) return
  const startCurrentTimeBlock = moment().utc().startOf(timeBlock)
  // console.log('startCurrentTimeBlock', startCurrentTimeBlock.format('YYYY-MM-DD'))
  return startCurrentTimeBlock.subtract(numTimeBlocks - 1, timeBlock).format('YYYY-MM-DD')
}

export function getBeforeDateDefault (timeBlock) {
  if (!timeBlock) return
  const startCurrentTimeBlock = moment().utc().startOf(timeBlock)
  let result = startCurrentTimeBlock.add(1, timeBlock) // TODO; why is this necessary again? IS it??
  if (timeBlock !== 'days') result = result.add(1, 'days') // TODO; remove but fix range
  return result.format('YYYY-MM-DD')
}
