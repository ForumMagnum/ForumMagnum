/* eslint-disable no-console */
import moment from "moment";
import { addCronJob } from "../cronUtil";
import { Globals } from "../vulcan-lib";
import PostViewsRepo from "../repos/PostViewsRepo";

async function updatePostViews({earliestStartDate, latestEndDate}: {earliestStartDate: Date, latestEndDate: Date}) {
  const postViewsRepo = new PostViewsRepo()

  const { earliestWindowStart, latestWindowEnd } = await postViewsRepo.getDateBounds()

  const ranges: {startDate: Date, endDate: Date}[] = []

  // Start from the earliestStartDate and create ranges up to endDate
  let currentDate = moment(earliestStartDate).startOf('day').toDate();

  // Ensure we cover the endDate if it's the same as latestWindowEnd
  const inclusiveEndDate = latestWindowEnd && moment(latestWindowEnd).subtract(1, 'day').toDate();

  while (currentDate <= latestEndDate) {
    // Skip dates that are within the [earliestWindowStart, latestWindowEnd) interval
    if (
      earliestWindowStart === null ||
      inclusiveEndDate === null ||
      currentDate < earliestWindowStart ||
      currentDate >= inclusiveEndDate
    ) {
      const startOfDay = moment(currentDate).startOf("day").toDate();
      const endOfDay = moment(currentDate).endOf("day").toDate();
      ranges.push({ startDate: startOfDay, endDate: endOfDay });
    }
    // Move to the next day
    currentDate = moment(currentDate).add(1, 'day').toDate();
  }

  console.log("Calculated ranges")

  for (const range of ranges) {
    console.log(`Updating post views data for range: ${range.startDate.toISOString()} to ${range.endDate.toISOString()}`)

    const data: Omit<DbPostViews, "_id" | "schemaVersion" | "createdAt" | "legacyData">[] =
      await postViewsRepo.calculateDataForDateRange(range);

    console.log(`Calculated ${data.length} rows`)

    console.log("Upserting data")
    await postViewsRepo.upsertData({ data })
    console.log("Done")
  }
}

async function updateAnalyticsCollections(props: {startDate?: string}) {
  const { startDate } = props ?? {}
  // If no explicit start date is given, only go back 1 week to avoid this being slow
  const earliestStartDate = startDate ? moment(startDate).startOf('day').toDate() : moment().utc().subtract(1, 'week').startOf('day').toDate();
  // endDate is the end of the current day
  const endDate = moment().utc().endOf('day').toDate();

  await updatePostViews({earliestStartDate, latestEndDate: endDate})

  console.log("Starting updateAnalyticsCollections")
}

addCronJob({
  name: "updateAnalyticsCollections",
  interval: "every 1 hour",
  job: async () => updateAnalyticsCollections({}),
});

Globals.updateAnalyticsCollections = updateAnalyticsCollections
