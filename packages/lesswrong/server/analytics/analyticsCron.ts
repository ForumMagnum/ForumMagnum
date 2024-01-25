/* eslint-disable no-console */
import moment from "moment";
import { addCronJob } from "../cronUtil";
import { Globals } from "../vulcan-lib";
import PostViewsRepo from "../repos/PostViewsRepo";
import PostViewTimesRepo from "../repos/PostViewTimesRepo";
import IncrementalViewRepo from "../repos/IncrementalViewRepo";
import { isEAForum } from "../../lib/instanceSettings";

async function updateDailyAnalyticsCollection<N extends CollectionNameString>({
  repo,
  earliestStartDate,
  latestEndDate,
}: {
  repo: IncrementalViewRepo<N>;
  earliestStartDate: Date;
  latestEndDate: Date;
}) {
  // The dates do we already have data for, and therefore for which we don't need to recalculate
  // (apart from the end date due to possible partial data)
  const { earliestWindowStart, latestWindowEnd } = await repo.getDateBounds()

  // `ranges` will be a list of days to recalculate the data for. When this is running as a cron job in steady state,
  // this will just be the most recent day. In general it will be all days between `earliestStartDate` and `latestEndDate`
  // that are not already covered by the range [`earliestWindowStart`, `latestWindowEnd`)
  const ranges: {startDate: Date, endDate: Date}[] = []

  let currentDate = moment(earliestStartDate).startOf('day').toDate();

  // Ensure we cover the endDate if it's the same as latestWindowEnd
  const inclusiveEndDate = latestWindowEnd && moment(latestWindowEnd).subtract(1, 'day').toDate();

  while (currentDate <= latestEndDate) {
    // Skip dates for which we already have the data
    if (
      earliestWindowStart === null ||
      inclusiveEndDate === null ||
      currentDate < earliestWindowStart ||
      currentDate >= inclusiveEndDate
    ) {
      const startOfDay = moment(currentDate).utc().startOf("day").toDate();
      const endOfDay = moment(currentDate).utc().endOf("day").toDate();
      ranges.push({ startDate: startOfDay, endDate: endOfDay });
    }
    // Move to the next day
    currentDate = moment(currentDate).utc().add(1, 'day').toDate();
  }

  // Reverse ranges so the most recent days are done first
  ranges.reverse()

  for (const range of ranges) {
    // Allow individual days to fail
    try {
      console.log(`Updating data for range: ${range.startDate.toISOString()} to ${range.endDate.toISOString()}`)

      const data = await repo.calculateDataForDateRange(range);

      console.log(`Calculated ${data.length} rows, upserting data`)

      await repo.upsertData({ data })
      console.log(`Finished updating data for range: ${range.startDate.toISOString()} to ${range.endDate.toISOString()}`)
    } catch (e) {
      console.error(e)
      continue
    }
  }
}

async function updatePostViews({earliestStartDate, latestEndDate}: {earliestStartDate: Date, latestEndDate: Date}) {
  console.log("Updating PostViews collection")
  await updateDailyAnalyticsCollection({repo: new PostViewsRepo(), earliestStartDate, latestEndDate})
  console.log("Finished PostViews collection")
}

async function updatePostViewTimes({earliestStartDate, latestEndDate}: {earliestStartDate: Date, latestEndDate: Date}) {
  console.log("Updating PostViewTimes collection")
  await updateDailyAnalyticsCollection({repo: new PostViewTimesRepo(), earliestStartDate, latestEndDate})
  console.log("Finished PostViewTimes collection")
}

async function updateAnalyticsCollections(props: {startDate?: string}) {
  const { startDate } = props ?? {}

  // If no explicit start date is given, only go back 1 week to avoid this being slow
  const earliestStartDate = startDate ? moment(startDate).utc().startOf('day').toDate() : moment().utc().subtract(1, 'week').startOf('day').toDate();
  // endDate is the end of the current day
  const endDate = moment().utc().endOf('day').toDate();

  console.log(`Starting updateAnalyticsCollections. startDate (given): ${startDate}, earliestStartDate: ${earliestStartDate}, endDate: ${endDate}`)

  try {
    await updatePostViews({earliestStartDate, latestEndDate: endDate})
  } catch (e) {
    console.error("Failed to update PostViews collection")
    console.error(e)
  }

  try {
    await updatePostViewTimes({earliestStartDate, latestEndDate: endDate})
  } catch (e) {
    console.error("Failed to update PostViewTimes collection")
    console.error(e)
  }

  console.log("Finished updateAnalyticsCollections")
}

if (isEAForum) {
  addCronJob({
    name: "updateAnalyticsCollections",
    interval: "every 20 minutes",
    job: async () => updateAnalyticsCollections({}),
  });
}

Globals.updateAnalyticsCollections = updateAnalyticsCollections
