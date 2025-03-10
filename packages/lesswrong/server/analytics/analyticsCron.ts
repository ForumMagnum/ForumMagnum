/* eslint-disable no-console */
import moment from "moment";
import { addCronJob } from "../cron/cronUtil";
import PostViewsRepo from "../repos/PostViewsRepo";
import PostViewTimesRepo from "../repos/PostViewTimesRepo";
import IncrementalViewRepo from "../repos/IncrementalViewRepo";
import { isEAForum } from "../../lib/instanceSettings";
import { loggerConstructor } from "../../lib/utils/logging";

const logger = loggerConstructor("cron-updateAnalyticsCollections")

async function updateDailyAnalyticsCollection<N extends CollectionNameString>({
  repo,
  earliestStartDate,
  latestEndDate,
  force = false,
  dryRun = false,
}: {
  repo: IncrementalViewRepo<N>;
  earliestStartDate: Date;
  latestEndDate: Date;
  force?: boolean;
  dryRun?: boolean;
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
      force ||
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
      logger(`Updating data for range: ${range.startDate.toISOString()} to ${range.endDate.toISOString()}`)

      const data = await repo.calculateDataForDateRange(range);

      logger(`Calculated ${data.length} rows, upserting data`)

      if (force && !dryRun) {
        logger("Deleting existing data in range (due to `force` parameter)")
        await repo.deleteRange(range)
      }

      if (!dryRun) {
        await repo.upsertData({ data })
      }
      logger(`Finished updating data for range: ${range.startDate.toISOString()} to ${range.endDate.toISOString()}`)
    } catch (e) {
      console.error(e)
      continue
    }
  }
}

async function updatePostViews({earliestStartDate, latestEndDate, force, dryRun}: {earliestStartDate: Date, latestEndDate: Date, force?: boolean, dryRun?: boolean}) {
  logger("Updating PostViews collection")
  await updateDailyAnalyticsCollection({repo: new PostViewsRepo(), earliestStartDate, latestEndDate, force, dryRun})
  logger("Finished PostViews collection")
}

async function updatePostViewTimes({earliestStartDate, latestEndDate, force, dryRun}: {earliestStartDate: Date, latestEndDate: Date, force?: boolean, dryRun?: boolean}) {
  logger("Updating PostViewTimes collection")
  await updateDailyAnalyticsCollection({repo: new PostViewTimesRepo(), earliestStartDate, latestEndDate, force, dryRun})
  logger("Finished PostViewTimes collection")
}

/**
 * Updates the analytics collections for post views and post view times within a specified date range.
 * If no date range is provided, it defaults to the past week up to the current day.
 * 
 * @param props - An object containing optional parameters:
 *   startDate: A string representing the start date for the update (inclusive)
 *   endDate: A string representing the end date for the update (inclusive)
 *   force: Whether to force the full recalculation of data even if it already exists
 *   dryRun: Whether to simulate the update without writing anything
 *
 * Exported to allow running from "yarn repl".
 */
export async function updateAnalyticsCollections(props: {startDate?: string, endDate?: string, force?: boolean, dryRun?: boolean}) {
  const { startDate, endDate, force, dryRun } = props ?? {}

  // If no explicit start date is given, only go back 1 week to avoid this being slow
  const earliestStartDate = startDate ? moment(startDate).utc().startOf('day').toDate() : moment().utc().subtract(1, 'week').startOf('day').toDate();
  // endDate is the end of the current day unless specified
  const latestEndDate = endDate ? moment(endDate).utc().endOf('day').toDate() : moment().utc().endOf('day').toDate();

  logger(`Starting updateAnalyticsCollections. startDate (given): ${startDate}, earliestStartDate: ${earliestStartDate}, endDate: ${latestEndDate}`)

  try {
    await updatePostViews({earliestStartDate, latestEndDate, force, dryRun})
  } catch (e) {
    console.error("Failed to update PostViews collection")
    console.error(e)
  }

  try {
    await updatePostViewTimes({earliestStartDate, latestEndDate, force, dryRun})
  } catch (e) {
    console.error("Failed to update PostViewTimes collection")
    console.error(e)
  }

  logger("Finished updateAnalyticsCollections")
}

export const cronUpdateAnalyticsCollections = addCronJob({
  name: "updateAnalyticsCollections",
  interval: "every 20 minutes",
  disabled: !isEAForum,
  job: async () => {
    await updateAnalyticsCollections({});
  }
});

