/*global Vulcan*/

// When running migrations with split batches, the fraction of time spent
// running those batches (as opposed to sleeping). Used to limit database
// load, since maxing out database capacity with a migration script could bring
// the site down otherwise. See `runThenSleep`.
const DEFAULT_LOAD_FACTOR = 0.5;

export function registerMigration({ name, idempotent, action })
{
  // The 'idempotent' parameter is mostly about forcing you to explicitly think
  // about migrations' idempotency and make them idempotent, and only
  // secondarily to enable the possibility of non-idempotent migrations later.
  // If you try to define a migration without marking it idempotent, throw an
  // error.
  if (!idempotent) {
    throw new Error(`Migration ${name} is not marked as idempotent; it can't use registerMigration unless it's marked as (and is) idempotent.`);
  }
  
  // Put the migration function in a dictionary Vulcan.migrations to make it
  // accessible in meteor shell, working around awkward inability to import
  // things non-relatively there.
  if (!Vulcan.migrations) {
    Vulcan.migrations = {};
  }
  
  Vulcan.migrations[name] = async () => {
    // eslint-disable-next-line no-console
    console.log(`Beginning migration: ${name}`);
    
    try {
      await action();
      
      // eslint-disable-next-line no-console
      console.log(`Finished migration: ${name}`);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(`FAILED migration: ${name}.`);
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };
}

function sleep(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Takes in a function and a load-factor, returns a new function that runs the original
// function, but then sleep afterwards, such that if you apply this
// to each of a series of batches, the fraction of time spent not sleeping 
// is equal to `loadFactor`. Used when doing a batch migration or similarly slow operation,
// which can be broken into smaller steps, to keep the database load low 
// enough for the site to keep running.

export function throttleFunction(func, loadFactor) {
  return async (...args) => {
    if (loadFactor <=0 || loadFactor > 1)
      throw new Error(`Invalid loadFactor ${loadFactor}: must be in (0,1].`);
  
    const startTime = new Date();
    let returnValue = null
    try {
      returnValue = await func(...args);
    } finally {
      const endTime = new Date();
      const timeSpentMs = endTime-startTime;
      
      // loadFactor = timeSpentMs / (timeSpentMs + sleepTimeMs)
      //   [Algebra happens]
      // sleepTimeMs = timeSpentMs * (1/loadFactor - 1)
      const sleepTimeMs = timeSpentMs * ((1/loadFactor) - 1);
      await sleep(sleepTimeMs);
    }
    return returnValue
  }
}

async function migrateBucket(percentile, fieldName, collection, batchOptions, defaultValue) {
  const query = {
    [fieldName]: null,
    [batchOptions.fieldName]: {$lt: percentile.value},
  }
  const mutation = { $set: {
    [fieldName]: defaultValue
    }
  }
  const options = { multi: true }
  const writeResult = await collection.update(query, mutation, options)
  // eslint-disable-next-line no-console
  console.log(`Bucket with max ${JSON.stringify(percentile.value)} done. Writeresult: ${JSON.stringify(writeResult)}`);
}

// Given a collection which has a field that has a default value (specified
// with ...schemaDefaultValue), fill in the default value for any rows where it
// is missing.
export async function fillDefaultValues({ collection, fieldName, batchOptions, loadFactor=DEFAULT_LOAD_FACTOR })
{
  if (!collection) throw new Error("Missing required argument: collection");
  if (!fieldName) throw new Error("Missing required argument: fieldName");
  const schema = collection.simpleSchema()._schema
  if (!schema) throw new Error(`Collection ${collection.collectionName} does not have a schema`);
  const defaultValue = schema[fieldName].defaultValue;
  if (defaultValue === undefined) throw new Error(`Field ${fieldName} does not have a default value`);
  if (!schema[fieldName].canAutofillDefault) throw new Error(`Field ${fieldName} is not marked autofillable`);

  // eslint-disable-next-line no-console
  console.log(`Filling in default values of ${collection.collectionName}.${fieldName}`);
  if (batchOptions) {
    // Apply default values to batchOptions
    batchOptions = { bucketSize: 10000, fieldName: '_id', ...batchOptions }

    // Get total collection size
    const { count: collectionSize } = await collection.rawCollection().stats()

    // Calculate target number of buckets
    const bucketCount = Math.floor(collectionSize / batchOptions.bucketSize)

    // Calculate target sample size
    const sampleSize = 20 * bucketCount

    // Calculate percentiles using Mongo aggregate
    const percentiles = await collection.rawCollection().aggregate([
      { $sample: { size: sampleSize } },
      { $sort: {[batchOptions.fieldName]: 1} },
      { $bucketAuto: { groupBy: ('$' + batchOptions.fieldName), buckets: bucketCount}},
      { $project: {value: '$_id.max', _id: 0}}
    ]).toArray()

    const throttledMigrateBucket = throttleFunction(loadFactor, migrateBucket)

    // Starting at the lowest percentile, modify everything
    for (const percentile of percentiles) {
      await throttledMigrateBucket(percentile, fieldName, collection, batchOptions, defaultValue)
    }
    // Then clean up the stragglers that weren't in any of the buckets (because of measurement error)
  }
  
  const writeResult = await collection.update({
    [fieldName]: null
  }, {
    $set: {
      [fieldName]: defaultValue
    }
  }, {
    multi: true,
  });

  // eslint-disable-next-line no-console
  console.log(`Done. ${JSON.stringify(writeResult)} rows affected`);
}

// Given a query which finds documents in need of a migration, and a function
// which takes a batch of documents and migrates them, repeatedly search for
// unmigrated documents and call the migrate function, until there are no
// unmigrated documents left.
//
// `migrate` should be a function which takes an array of documents (from a
// `collection.find`), and performs database operations to update them. After
// the update is performed, the documents should no longer match
// unmigratedDocumentQuery. (If they do, and the same document gets returned
// in any two consecutive queries, this will abort and throw an exception.
// However, this is not guaranteed to ever happen, because the
// unmigratedDocumentQuery is run without a sort criterion applied).
//
// No special effort is made to do locking or protect you from race conditions
// if things other than this migration script are happening on the same
// database. This function makes sense for filling in new denormalized fields,
// where figuring out the new field's value requires an additional query.
export async function migrateDocuments({ description, collection, batchSize, unmigratedDocumentQuery, migrate, loadFactor=DEFAULT_LOAD_FACTOR })
{
  // Validate arguments
  if (!collection) throw new Error("Missing required argument: collection");
  if (!unmigratedDocumentQuery) throw new Error("Missing required argument: unmigratedDocumentQuery");
  if (!migrate) throw new Error("Missing required argument: migrate");
  if (!batchSize || !(batchSize>0)) throw new Error("Invalid batch size");
  
  // Assign default values
  description = description || `Migration on ${collection.collectionName}`
  
  // eslint-disable-next-line no-console
  console.log(`Beginning migration step: ${description}`);

  // Set up migration functions
  async function getDocuments() {
    return collection.find(unmigratedDocumentQuery, {limit: batchSize}).fetch()
  }
  const throttledMigrateDocuments = throttleFunction(migrateWithDocumentIds, loadFactor)
  const throttledGetDocuments = throttleFunction(getDocuments, loadFactor)

  // Set up loop variables
  let migratedDocumentIds = new Set()
  let currentDocuments = await getDocuments() // Get initial batch of documents
  if (currentDocuments.length < 1) {
    // eslint-disable-next-line no-console
    console.log(`No documents to migrate in ${description}`)
    return
  }

  while (currentDocuments.length > 0) {
    // Check whether we failed to migrate any previous documents
    await checkDocuments(currentDocuments, migratedDocumentIds)
    // Migrate the current batch, then sleep
    migratedDocumentIds = await throttledMigrateDocuments(currentDocuments, migrate, migratedDocumentIds)
    // Query for new documents, then sleep
    currentDocuments = await throttledGetDocuments()
  }
  
  // eslint-disable-next-line no-console
  console.log(`Finished migration step: ${description}. ${migratedDocumentIds.size} documents affected.`);
}

async function migrateWithDocumentIds(documents, migrate, migratedDocumentIds) {
  // Migrate the current batch
  try {
    await migrate(documents)
    // Add all migrated documents to migratedDocumentIds set
    const newMigratedDocumentIds = new Set([...(_.pluck(documents, "_id")), ...migratedDocumentIds])
    // eslint-disable-next-line no-console
    console.log("Documents updated: ", newMigratedDocumentIds.size)
    return newMigratedDocumentIds
  } catch(e) {
     // eslint-disable-next-line no-console
     console.error("Error running migration");
     // eslint-disable-next-line no-console
     console.error(JSON.stringify(e));
     throw(e);
  }
}

function setIntersection(a, b) {
  return new Set([...a].filter(x => b.has(x)));
}

async function checkDocuments(documents, migratedDocumentIds) {
  // Check whether we failed to migrate any previous documents
  const unmigratedDocuments = setIntersection(new Set(_.pluck(documents, '_id')), migratedDocumentIds)
  if (unmigratedDocuments.size > 0) {
    let errorMessage = `Documents not updated in migrateDocuments: ${[...unmigratedDocuments.values()]}`;
    // eslint-disable-next-line no-console
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}
