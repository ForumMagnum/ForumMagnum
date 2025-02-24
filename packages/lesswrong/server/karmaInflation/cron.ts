import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import { nullKarmaInflationSeries, setKarmaInflationSeries, TimeSeries } from '../../lib/collections/posts/karmaInflation';
import { addCronJob } from '../cronUtil';
import { Vulcan } from '../../lib/vulcan-lib/config';
import PostsRepo from '../repos/PostsRepo';
import DatabaseMetadataRepo from '../repos/DatabaseMetadataRepo';

const AVERAGING_WINDOW_MS = 1000 * 60 * 60 * 24 * 28; // 28 days

export async function refreshKarmaInflation() {
  // eslint-disable-next-line no-console
  console.log("Refreshing karma inflation");

  const postsRepo = new PostsRepo();

  // use the postedAt of the earliest post as the start time for the series
  const startDate = await postsRepo.getEarliestPostTime();
  const meanKarmaByInterval = await postsRepo.getMeanKarmaByInterval(startDate, AVERAGING_WINDOW_MS);
  const meanKarmaOverall = await postsRepo.getMeanKarmaOverall();

  const reciprocalOrOne = (x: number) => x === 0 ? 1 : 1 / x;

  // _id in meanKarmaByInterval always corresponds to the index of that interval in
  // the final time series, but meanKarmaByInterval may be missing some intervals (if there are no posts during that time)
  // so use the highest index + 1 to get the final length of the time series
  const arrLen = meanKarmaByInterval[meanKarmaByInterval.length - 1]._id + 1;
  let values = new Array(arrLen).fill(reciprocalOrOne(meanKarmaOverall));

  for (const { _id, meanKarma } of meanKarmaByInterval) {
    values[_id] = reciprocalOrOne(meanKarma);
  }

  if (values.length > 1) {
    // for the most recent window a lot of the time summed over may be in the future,
    // so use the last complete window to estimate the current inflation adjustment
    values[values.length - 1] = values[values.length - 2];
  }

  const karmaInflationSeries: TimeSeries = {
    start: startDate.getTime(),
    interval: AVERAGING_WINDOW_MS,
    values: values
  };

  // insert the new series into the db
  try {
    await new DatabaseMetadataRepo().upsertKarmaInflationSeries(karmaInflationSeries);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // refresh the cache after every update
  // it's a bit wasteful to immediately go and fetch the thing we just calculated from the db again,
  // but seeing as this is a cron job it doesn't really matter
  await refreshKarmaInflationCache();
}

export async function refreshKarmaInflationCache() {
  const karmaInflationSeries = await DatabaseMetadata.findOne({ name: "karmaInflationSeries" });
  setKarmaInflationSeries(karmaInflationSeries?.value || nullKarmaInflationSeries);
}

addCronJob({
  name: 'refreshKarmaInflationCron',
  interval: 'every 24 hours',
  job() {
    void refreshKarmaInflation();
  }
});

Vulcan.refreshKarmaInflation = refreshKarmaInflation;
