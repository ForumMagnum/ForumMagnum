
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
export async function forEachDocumentBatchInCollection({collection, batchSize, callback})
{
  let rows = collection.find({}, {limit: batchSize});
  
  do {
    await callback(rows);
    
    const lastID = _.max(rows, row => row._id);
    rows = await collection.find(
      { _id: {$gt: lastID} },
      { limit: batchSize }
    );
  } while(rows.length > 0)
}
