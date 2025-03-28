import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/*
 * User Activities
 *
 * We want to vary the recency bias of the frontpage based on how active a use
 * has been. To do this, we want to get an activity factor between zero and one,
 * representing how active a user has been in the last ACTIVITY_WINDOW_HOURS (21
 * days).
 *
 * There are two steps to calculate this:
 *  1. Get an array of whether a user was active or not (binary) for every hour
 *     in the past 21 days, and store that in this collection/table
 *  2. When the frontpage loads, just-in-time calculate the activity factor from
 *     that array, using an exponential decay.
 *
 * Details of step 1.
 *  - We use timerEvents from the analytics database to determine an array of
 *    whether a user was active for each hour
 *  - Calculating this array is very slow, so we do so in a background cron job
 *    - It is even too slow (15 minutes) to do a full refresh every 3 hours, so
 *      we incrementally update the table (i.e. concatenate the latest 3 hours
 *      every time)
 *  - See server/useractivities/cron.ts for more info
 *
 * Details of step 2.
 *  - We smooth out the influence of a visit by expanding the influence of a
 *    single hour into a 24 hour period of full activity. This creates a
 *    synthetic "expanded activity array"
 *  - We then add up the hours a user was "active", with an exponential decay
 *    factor as you go further into the past
 *  - Finally we normalise the result to make it between 0 and 1
 *  - See server/useractivities/utils.ts for more info
 *
 * NB: Just to confuse things, we actually go back 22 days, because we don't
 * care about the user's activity in the past 24 hours. We've elided that in
 * this docstring.
 */

export const UserActivities: UserActivitiesCollection = createCollection({
  collectionName: 'UserActivities',
  typeName: 'UserActivity',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserActivities', { visitorId: 1, type: 1 });
    return indexSet;
  },
  logChanges: true,
});


export default UserActivities;
