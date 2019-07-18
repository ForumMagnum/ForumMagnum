import moment from 'moment-timezone';

// Given a list of posts and a date, get all the posts in the same {timeBlock}
// as the date.
// Export for testing
// TODO; kwargs
export const getDatePosts = (posts, date, timeBlock, timeField, timezone) => {
  // console.log('getDatePosts')
  // console.log(' date moment', moment(date))
  // console.log(' timeBlock', timeBlock)
  // console.log(' timeField', timeField)
  // console.log(' timezone', timezone)
  const result = _.filter(posts, post => {
    const postDate = moment(new Date(timeField ? post[timeField] : post.postedAt))
      .tz(timezone)
    // console.log(' postDate', postDate.format('YYYY-MM-DD'))
    // console.log(' postDate moment', postDate)
    const result = postDate.isSame(moment(date), timeBlock)
    // console.log(' result', result)
    return result
  })
  // console.log('/getDatePosts')
  return result
}

// Return a date string for each date which should have a section. This
// includes all dates in the range (inclusive), *except* that if the newest date has no
// posts, it's omitted. (Because the end of the range is some fraction of a
// day into the future, which would otherwise sometimes result in an awkward
// empty slot for tomorrow, depending on the current time of day.)
// TODO; See TODO in getBeforeDateDefault for if this functionality is necessary
// Export for testing
export const getDateRange = (after, before, posts, timeBlock, timeField, timezone) => {
  // console.log('getDateRange')
  // console.log(' after', after)
  // console.log(' before', before)
  // console.log(' timeBlock', timeBlock)
  // console.log(' timezone', timezone)
  const mAfter = moment.utc(after, 'YYYY-MM-DD');
  const mBefore = moment.utc(before, 'YYYY-MM-DD');
  const timeBlocksCount = mBefore.diff(mAfter, timeBlock) + 1;
  // console.log(' timeBlocksCount', timeBlocksCount)
  const range = _.range(timeBlocksCount).map(
    i => moment.utc(before, 'YYYY-MM-DD').subtract(i, timeBlock)
      .tz(timezone)
      .format('YYYY-MM-DD')
  );
  // console.log(' range', range)

  if(getDatePosts(posts, range[0], timeBlock, timeField, timezone).length === 0) {
    // console.log(' last timeBlock has no posts, returning')
    return _.rest(range);
  }
  // console.log(' last timeBlock actually does have posts')
  return range;
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
