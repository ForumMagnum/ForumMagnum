import { onStartup } from '../../lib/executionEnvironment';
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import { Posts } from '../../lib/collections/posts';
import { nullKarmaInflationSeries, setKarmaInflationSeries, TimeSeries, timeSeriesIndexExpr } from './cache';
import { addCronJob } from '../cronUtil';
import { postStatuses } from '../../lib/collections/posts/constants';
import { Vulcan } from '../vulcan-lib';
import PostsRepo, { MeanPostKarma } from '../repos/PostsRepo';

const AVERAGING_WINDOW_MS = 1000 * 60 * 60 * 24 * 28; // 28 days

const KARMA_INFLATION_SELECTOR = {
  status: postStatuses.STATUS_APPROVED,
  draft: false,
  isFuture: false,
  unlisted: false,
  shortform: false,
  authorIsUnreviewed: false,
  hiddenRelatedQuestion: false,
  postedAt: { $exists: true },
  isEvent: false
};

const getEarliestPostTime = async (postsRepo: PostsRepo): Promise<Date> => {
  if (Posts.isPostgres()) {
    return postsRepo.getEarliestPostTime();
  } else {
    const earliestPost = await Posts.aggregate([{
      $match: KARMA_INFLATION_SELECTOR,
    }, { $group: { _id: null, minPostedAt: { $min: "$postedAt" } } }]).toArray();
    return earliestPost[0].minPostedAt;
  }
}

const getMeanKarmaByInterval = (postsRepo: PostsRepo, startDate: Date): Promise<MeanPostKarma[]> => {
  if (Posts.isPostgres()) {
    return postsRepo.getMeanKarmaByInterval(startDate, AVERAGING_WINDOW_MS);
  } else {
    return Posts.aggregate([{
      $match: KARMA_INFLATION_SELECTOR,
    }, {
      $group: { _id: timeSeriesIndexExpr("$postedAt", startDate.getTime(), AVERAGING_WINDOW_MS), meanKarma: { $avg: "$baseScore" } }
    }, {
      $sort: { _id: 1 }
    }]).toArray();
  }
}

const getMeanKarmaOverall = async (postRepo: PostsRepo): Promise<number> => {
  if (Posts.isPostgres()) {
    return postRepo.getMeanKarmaOverall();
  } else {
    const result = await Posts.aggregate([{
      $match: KARMA_INFLATION_SELECTOR,
    }, {
      $group: { _id: null, meanKarma: { $avg: "$baseScore" } }
    }]).toArray();
    return result[0].meanKarma;
  }
}

export async function refreshKarmaInflation() {
  // eslint-disable-next-line no-console
  console.log("Refreshing karma inflation");

  const postsRepo = new PostsRepo();

  // use the postedAt of the earliest post as the start time for the series
  const startDate = await getEarliestPostTime(postsRepo);
  const meanKarmaByInterval = await getMeanKarmaByInterval(postsRepo, startDate);
  const meanKarmaOverall = await getMeanKarmaOverall(postsRepo);

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
  await DatabaseMetadata.rawUpdateOne({ name: "karmaInflationSeries" }, {
    $set: { value: karmaInflationSeries }
  }, { upsert: true });

  // refresh the cache after every update
  // it's a bit wasteful to immediately go and fetch the thing we just calculated from the db again,
  // but seeing as this is a cron job it doesn't really matter
  await refreshKarmaInflationCache();
}

export async function refreshKarmaInflationCache() {
  const karmaInflationSeries = await DatabaseMetadata.findOne({ name: "karmaInflationSeries" });
  setKarmaInflationSeries(karmaInflationSeries?.value || nullKarmaInflationSeries);
}

onStartup(async () => {
  await refreshKarmaInflationCache();
});

addCronJob({
  name: 'refreshKarmaInflationCron',
  interval: 'every 24 hours',
  job() {
    void refreshKarmaInflation();
  }
});

Vulcan.refreshKarmaInflation = refreshKarmaInflation;
