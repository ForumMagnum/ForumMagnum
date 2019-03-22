import { runThenSleep } from './migrations/migrationUtils';

// Given a collection and a batch size, run a callback for each row in the
// collection, grouped into batches of up to the given size. Rows created or
// deleted while this is running might or might not get included (neither is
// guaranteed).
//
// This works by querying a range of IDs, with a limit, and using the largest
// ID from each batch to find the start of the interval for the next batch.
// This expects that `max` is a sensible operation on IDs, treated the same
// way in Javascript as in Mongo; which translates into the assumption that IDs
// are homogenously string typed. Ie, this function will break if some rows
// have _id of type ObjectID instead of string.
export async function forEachDocumentBatchInCollection({collection, batchSize, callback, loadFactor=1.0})
{
  let rows = await collection.find({},
    {
      sort: {_id: 1},
      limit: batchSize
    }
  ).fetch();
  
  do {
    await runThenSleep(loadFactor, async () => {
      await callback(rows);
      const lastID = rows[rows.length - 1]._id
      rows = await collection.find(
        { _id: {$gt: lastID} },
        {
          sort: {_id: 1},
          limit: batchSize
        }
      ).fetch();
    });
  } while(rows.length > 0)
}

// Given a collection, an optional filter, and a target batch size, partition
// the collection into buckets of approximately that size, and call a function
// with a series of selectors that narrow the collection to each of those
// buckets.
//
// collection: The collection to iterate over.
// filter: (Optional) A mongo query which constrains the subset of documents
//     iterated over.
// bucketSize: Approximate number of results in each bucket. This will not
//     be exact, both because buckets will be approximately balanced (so eg if
//     you ask for 2k-row buckets of a 3k-row collection, you actually get
//     1.5k-row average buckets), and because bucket boundaries are generated
//     by a statistical approximation using sampling.
// fn: (bucketSelector=>null) Callback function run for each bucket. Takes a
//     selector, which includes both an _id range (either one- or two-sided)
//     and also the selector from `filter`.
export async function forEachBucketRangeInCollection({collection, filter, bucketSize, fn})
{
  // Get filtered collection size and use it to calculate a number of buckets
  const count = await collection.find(filter).count();

  // If no documents match the filter, return with zero batches
  if (count === 0) return;
  
  // Calculate target number of buckets
  const bucketCount = Math.max(1, Math.floor(count / bucketSize));

  // Calculate target sample size
  const sampleSize = 20 * bucketCount

  // Calculate bucket boundaries using Mongo aggregate
  const maybeFilter = (filter ? [{ $match: filter }] : []);
  const bucketBoundaries = await collection.rawCollection().aggregate([
    ...maybeFilter,
    { $sample: { size: sampleSize } },
    { $sort: {_id: 1} },
    { $bucketAuto: { groupBy: '$_id', buckets: bucketCount}},
    { $project: {value: '$_id.max', _id: 0}}
  ]).toArray();

  // Starting at the lowest bucket boundary, iterate over buckets
  await fn({
    _id: {$lt: bucketBoundaries[0].value},
    ...filter
  });
  
  for (let i=0; i<bucketBoundaries.length-1; i++) {
    await fn({
      _id: {
        $gte: bucketBoundaries[i].value,
        $lt: bucketBoundaries[i+1].value,
      },
      ...filter
    })
  }
  
  await fn({
    _id: {$gte: bucketBoundaries[bucketBoundaries.length-1].value},
    ...filter
  });
}
