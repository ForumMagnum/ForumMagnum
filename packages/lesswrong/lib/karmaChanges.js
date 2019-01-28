import Votes from './collections/votes/collection.js';
import moment from 'moment-timezone';

// This file is mostly server-side, but lives in an included-with-client-bundle
// directory because we don't have a good way to make resolvers, or imports
// used by resolvers, be server specific.

export const karmaChangeNotifierDefaultSettings = {
  // One of the string keys in karmaNotificationTimingChocies
  updateFrequency: "daily",
  
  // Time of day at which daily/weekly batched updates are released, a number
  // of hours [0,24). Always in GMT, regardless of the user's time zone.
  timeOfDayGMT: 3,
  
  // A string day-of-the-week name, spelled out and capitalized like "Monday".
  // Always in GMT, regardless of the user's timezone (timezone matters for day
  // of the week because time zones could take it across midnight.)
  dayOfWeekGMT: "Saturday",
};

// Given a user and a date range, get a summary of karma changes that occurred
// during that date range.
//
// For example:
// {
//   totalChange: 10,
//   startDate: Date("2018-09-09"),
//   endDate: Date("2018-09-10"),
//   documents: [
//     {
//       _id: "12345",
//       collectionName: "Posts",
//       scoreChange: 3,
//     },
//     {
//       _id: "12345",
//       collectionName: "Comments",
//       scoreChange: -1,
//     },
//   ]
// }
export async function getKarmaChanges({user, startDate, endDate})
{
  if (!user) throw new Error("Missing required argument: user");
  if (!startDate) throw new Error("Missing required argument: startDate");
  if (!endDate) throw new Error("Missing required argument: endDate");
  if (startDate > endDate)
    throw new Error("getKarmaChanges: endDate must be after startDate");
  
  let changedDocs = await Votes.rawCollection().aggregate([
    // Get votes cast on this user's content (including cancelled votes)
    {$match: {
      authorId: user._id,
      votedAt: {$gte: startDate, $lte: endDate},
      userId: {$ne: user._id}, //Exclude self-votes
    }},
    
    // Group by thing-that-was-voted-on and calculate the total karma change
    {$group: {
      _id: "$documentId",
      collectionName: { $first: "$collectionName" },
      scoreChange: { $sum: "$power" },
    }},
  ]).toArray();
  
  let totalChange = 0;
  for (let changedDoc of changedDocs) {
    totalChange += changedDoc.scoreChange;
  }
  
  return {
    totalChange: totalChange,
    startDate: startDate,
    endDate: endDate,
    documents: changedDocs,
  };
}

export function getKarmaChangeDateRange({settings, now, lastOpened})
{
  // Greatest date prior to lastOpened at which the time of day matches
  // settings.timeOfDay.
  let todaysDailyReset = moment(now).tz("GMT");
  todaysDailyReset.set('hour', Math.floor(settings.timeOfDayGMT));
  todaysDailyReset.set('minute', 60*(settings.timeOfDayGMT%1));
  todaysDailyReset.set('second', 0);
  todaysDailyReset.set('millisecond', 0);
  
  const lastDailyReset = todaysDailyReset.isAfter(now)
    ? todaysDailyReset.subtract(1, 'days')
    : todaysDailyReset;
  
  switch(settings.updateFrequency) {
    case "disabled":
      return null;
    case "daily":
      const oneDayPrior = lastDailyReset.subtract(1, 'days');
      return {
        start: oneDayPrior.min(lastOpened).toDate(),
        end: lastDailyReset.toDate(),
      };
    case "weekly":
      // Target day of the week, as an integer 0-6
      const targetDayOfWeekNum = moment().day(settings.dayOfWeekGMT).day();
      const lastDailyResetDayOfWeekNum = lastDailyReset.day();
      
      // Number of days back from today's daily reset to get to a daily reset
      // of the correct day of the week
      const daysOfWeekDifference = (lastDailyResetDayOfWeekNum - targetDayOfWeekNum + 7) % 7;
      
      const lastWeeklyReset = lastDailyReset.add(-daysOfWeekDifference, 'days');
      const oneWeekPrior = moment(lastWeeklyReset).add(-7, 'days');
      return {
        start: oneWeekPrior.min(lastOpened).toDate(),
        end: lastWeeklyReset.toDate(),
      };
    case "realtime":
      return {
        start: lastOpened,
        end: now,
      }
  }
}
