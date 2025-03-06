import Migrations from '../../server/collections/migrations/collection';
import * as _ from 'underscore';
import { getSchema } from '../../lib/utils/getSchema';
import { sleep, timedFunc } from '../../lib/helpers';
import { getSqlClient } from '../../server/sql/sqlClient';

// When running migrations with split batches, the fraction of time spent
// running those batches (as opposed to sleeping). Used to limit database
// load, since maxing out database capacity with a migration script could bring
// the site down otherwise. See `runThenSleep`.
const DEFAULT_LOAD_FACTOR = 0.5;

export const availableMigrations: Record<string,any> = {};
export const migrationRunners: Record<string,any> = {};

interface RegisterMigrationProps {
  name: string;
  dateWritten: string;
  idempotent: boolean;
  action: () => Promise<void>;
}

export function registerMigration({ name, dateWritten, idempotent, action }: RegisterMigrationProps)
{
  if (!name) throw new Error("Missing argument: name");
  if (!dateWritten)
    throw new Error(`Migration ${name} is missing required field: dateWritten`);
  if (!action)
    throw new Error(`Migration ${name} is missing required field: action`);
  
  // The 'idempotent' parameter is mostly about forcing you to explicitly think
  // about migrations' idempotency and make them idempotent, and only
  // secondarily to enable the possibility of non-idempotent migrations later.
  // If you try to define a migration without marking it idempotent, throw an
  // error.
  if (!idempotent) {
    throw new Error(`Migration ${name} is not marked as idempotent; it can't use registerMigration unless it's marked as (and is) idempotent.`);
  }

  if (name in availableMigrations) {
    throw new Error(`Duplicate migration or name collision: ${name}`);
  }
  
  availableMigrations[name] = { name, dateWritten, idempotent, action };
  const runner = async () => await runMigration(name);
  migrationRunners[name] = runner;
  return runner;
}

export async function runMigration(name: string)
{
  if (!(name in availableMigrations))
    throw new Error(`Unrecognized migration: ${name}`);
  // eslint-disable-next-line no-unused-vars
  const { dateWritten, idempotent, action } = availableMigrations[name];
  
  // eslint-disable-next-line no-console
  console.log(`Beginning migration: ${name}`);

  const migrationLogId = await Migrations.rawInsert({
    name: name,
    started: new Date(),
  });
  
  const db = getSqlClient();

  // TODO: do this atomically in a single transaction
  try {
    await safeRun(db, `remove_lowercase_views`) // Remove any views before we change the underlying tables
    await action();
    
    await Migrations.rawUpdateOne({_id: migrationLogId}, {$set: {
      finished: true, succeeded: true,
    }});
    
    // eslint-disable-next-line no-console
    console.log(`Finished migration: ${name}`);
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(`FAILED migration: ${name}.`);
    // eslint-disable-next-line no-console
    console.error(e);
    
    await Migrations.rawUpdateOne({_id: migrationLogId}, {$set: {
      finished: true, succeeded: false,
    }});
  } finally {
    await safeRun(db, `refresh_lowercase_views`) // add the views back in
  }
}

// Run a function, timing how long it took, then sleep for an amount of time
// such that if you apply this to each of a series of batches, the fraction of
// time spent not sleeping is equal to `loadFactor`. Used when doing a batch
// migration or similarly slow operation, which can be broken into smaller
// steps, to keep the database load low enough for the site to keep running.
export async function runThenSleep(loadFactor: number, func: () => Promise<void>)
{
  if (loadFactor <=0 || loadFactor > 1)
    throw new Error(`Invalid loadFactor ${loadFactor}: must be in (0,1].`);

  const startTime = new Date();
  try {
    await func();
  } finally {
    const endTime = new Date();
    const timeSpentMs = endTime.valueOf()-startTime.valueOf();

    // loadFactor = timeSpentMs / (timeSpentMs + sleepTimeMs)
    //   [Algebra happens]
    // sleepTimeMs = timeSpentMs * (1/loadFactor - 1)
    const sleepTimeMs = timeSpentMs * ((1/loadFactor) - 1);
    await sleep(sleepTimeMs);
  }
}

// Given a collection which has a field that has a default value (specified
// with ...schemaDefaultValue), fill in the default value for any rows where it
// is missing.
export async function fillDefaultValues<N extends CollectionNameString>({ collection, fieldName, batchSize, loadFactor=DEFAULT_LOAD_FACTOR }: {
  collection: CollectionBase<N>,
  fieldName: string,
  batchSize?: number,
  loadFactor?: number
})
{
  if (!collection) throw new Error("Missing required argument: collection");
  if (!fieldName) throw new Error("Missing required argument: fieldName");
  const schema = getSchema(collection);
  if (!schema) throw new Error(`Collection ${collection.collectionName} does not have a schema`);
  const defaultValue = schema[fieldName].defaultValue;
  if (defaultValue === undefined) throw new Error(`Field ${fieldName} does not have a default value`);
  if (!schema[fieldName].canAutofillDefault) throw new Error(`Field ${fieldName} is not marked autofillable`);

  // eslint-disable-next-line no-console
  console.log(`Filling in default values of ${collection.collectionName}.${fieldName}`);
  
  let nMatched = 0;
  
  await forEachBucketRangeInCollection({
    collection, bucketSize: batchSize||10000,
    filter: {
      [fieldName]: null
    },
    fn: async (bucketSelector) => {
      await runThenSleep(loadFactor, async () => {
        const mutation = { $set: {
          [fieldName]: defaultValue
        } };
        const writeResult = await collection.rawUpdateMany(bucketSelector, mutation, {multi: true});
        
        nMatched += writeResult || 0;
        // eslint-disable-next-line no-console
        console.log(`Finished bucket. Write result: ${JSON.stringify(writeResult)}`);
      });
    }
  });

  // eslint-disable-next-line no-console
  console.log(`Done. ${nMatched} rows matched`);
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
export async function migrateDocuments<N extends CollectionNameString>({
  description,
  collection,
  batchSize,
  unmigratedDocumentQuery,
  migrate,
  loadFactor=DEFAULT_LOAD_FACTOR,
  projection,
}: {
  description?: string,
  collection: CollectionBase<N>,
  batchSize?: number,
  unmigratedDocumentQuery?: any,
  migrate: (documents: Array<ObjectsByCollectionName[N]>) => Promise<void>,
  loadFactor?: number,
  projection?: MongoProjection<ObjectsByCollectionName[N]>
}) {
  // Validate arguments
  if (!collection) throw new Error("Missing required argument: collection");
  // if (!unmigratedDocumentQuery) throw new Error("Missing required argument: unmigratedDocumentQuery");
  if (!migrate) throw new Error("Missing required argument: migrate");
  if (!batchSize || !(batchSize>0))
    throw new Error("Invalid batch size");

  if (!description)
    description = "Migration on "+collection.collectionName;

  // eslint-disable-next-line no-console
  console.log(`Beginning migration step: ${description}`);

  if (!unmigratedDocumentQuery) {
    // eslint-disable-next-line no-console
    console.log(`No unmigrated-document query found, migrating all documents in ${collection.collectionName}`)
    await forEachDocumentBatchInCollection({collection, batchSize, callback: migrate, loadFactor, projection})
    // eslint-disable-next-line no-console
    console.log(`Finished migration step ${description} for all documents`)
    return
  }

  let previousDocumentIds: AnyBecauseTodo = {};
  let documentsAffected = 0;
  let done = false;

  // eslint-disable-next-line no-constant-condition
  while(!done) {
    await runThenSleep(loadFactor, async () => {
      let documents = await collection.find(unmigratedDocumentQuery, {limit: batchSize, ...(projection ? { projection } : {})}).fetch();

      if (!documents.length) {
        done = true;
        return;
      }

      // Check if any of the documents returned were supposed to have been
      // migrated by the previous batch's update operation.
      let docsNotMigrated = _.filter(documents, doc => previousDocumentIds[doc._id]);
      if (docsNotMigrated.length > 0) {
        let errorMessage = `Documents not updated in migrateDocuments: ${_.map(docsNotMigrated, doc=>doc._id)}`;

        // eslint-disable-next-line no-console
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      previousDocumentIds = {};
      _.each(documents, doc => previousDocumentIds[doc._id] = true);

      // Migrate documents in the batch
      try {
        await migrate(documents);
        documentsAffected += documents.length;
        // eslint-disable-next-line no-console
        console.log("Documents updated: ", documentsAffected)
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error("Error running migration");
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(e));
        throw(e);
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Finished migration step: ${description}. ${documentsAffected} documents affected.`);
}

export async function dropUnusedField(collection: AnyBecauseTodo, fieldName: string) {
  const loadFactor = 0.5;
  let nMatched = 0;
  
  await forEachBucketRangeInCollection({
    collection,
    filter: {
      [fieldName]: {$exists: true}
    },
    fn: async (bucketSelector) => {
      await runThenSleep(loadFactor, async () => {
        const mutation = { $unset: {
          [fieldName]: 1
        } };
        const writeResult = await collection.rawUpdateMany(
          bucketSelector,
          mutation,
          {multi: true}
        );
        
        nMatched += writeResult;
      });
    }
  });
  
  // eslint-disable-next-line no-console
  console.log(`Dropped unused field ${collection.collectionName}.${fieldName} (${nMatched} rows)`);
}

const getBatchSort = <T extends DbObject>(field = '_id') => ({ [field]: 1 }) as Record<keyof T, 1>;

const getFirstBatchById = async <N extends CollectionNameString>({
  collection,
  batchSize,
  filter,
  projection
}: {
  collection: CollectionBase<N>,
  batchSize: number,
  filter: MongoSelector<DbObject> | null,
  projection?: MongoProjection<ObjectsByCollectionName[N]>,
}): Promise<ObjectsByCollectionName[N][]> => {
  // As described in the docstring, we need to be able to query on the _id.
  // Without this check, someone trying to use _id in the filter would overwrite
  // this function's query and find themselves with an infinite loop.
  if (filter && "_id" in filter) {
    throw new Error('forEachDocumentBatchInCollection does not support filtering by _id')
  }
  return collection.find(
    { ...filter },
    {
      sort: getBatchSort(),
      limit: batchSize,
      ...(projection ? { projection } : {})
    }
  ).fetch();
}

const getNextBatchById = <N extends CollectionNameString>({
  collection,
  batchSize,
  filter,
  projection,
  lastRows,
}: {
  collection: CollectionBase<N>,
  batchSize: number,
  filter: MongoSelector<DbObject> | null,
  projection?: MongoProjection<ObjectsByCollectionName[N]>,
  lastRows: ObjectsByCollectionName[N][],
}): Promise<ObjectsByCollectionName[N][]> => {
  return collection.find(
    {
      _id: {$gt: lastRows[lastRows.length - 1]._id},
      ...filter,
    },
    {
      sort: getBatchSort(),
      limit: batchSize,
      ...(projection ? { projection } : {})
    }
  ).fetch();
}

const getFirstBatchByCreatedAt = async <N extends CollectionNameString>({
  collection,
  batchSize,
  filter,
  projection,
  overrideCreatedAt
}: {
  collection: CollectionBase<N>,
  batchSize: number,
  filter: MongoSelector<DbObject> | null,
  projection?: MongoProjection<ObjectsByCollectionName[N]>,
  overrideCreatedAt?: keyof ObjectsByCollectionName[N] & string
}): Promise<ObjectsByCollectionName[N][]> => {
  const sortField = overrideCreatedAt ?? 'createdAt';

  return collection.find(
    { ...filter },
    {
      sort: getBatchSort(sortField),
      limit: batchSize,
      ...(projection ? { projection } : {})
    }
  ).fetch();
}

const isValidDateCursor = (cursor: unknown): cursor is Date => {
  return cursor instanceof Date;
}

const getNextBatchByCreatedAt = <N extends CollectionNameString>({
  collection,
  batchSize,
  filter,
  projection,
  lastRows,
  overrideCreatedAt
}: {
  collection: CollectionBase<N>,
  batchSize: number,
  filter: MongoSelector<DbObject> | null,
  projection?: MongoProjection<ObjectsByCollectionName[N]>,
  lastRows: ObjectsByCollectionName[N][],
  overrideCreatedAt?: keyof ObjectsByCollectionName[N] & string
}): Promise<ObjectsByCollectionName[N][]> => {
  const sortField = overrideCreatedAt ?? 'createdAt';
  const lastRow = lastRows[lastRows.length - 1] as unknown as ObjectsByCollectionName[N] & HasCreatedAtType;
  let greaterThan: unknown = lastRow[sortField] ?? new Date(0);
  if (!isValidDateCursor(greaterThan)) {
    throw new Error(`Invalid greaterThan cursor; expected a date, got ${greaterThan} for field ${sortField}`);
  }
  if (filter && sortField in filter) {
    if (filter[sortField].$gt) {
      greaterThan = new Date(Math.max(greaterThan.getTime(), filter[sortField].$gt.getTime()));
    } else if (filter[sortField].$gte) {
      const gt = Math.max(filter[sortField].$gte.getTime() - 1, 0);
      greaterThan = new Date(Math.max(greaterThan.getTime(), gt));
      delete filter[sortField];
    } else {
      throw new Error(`Unsupported createdAt filter in getNextBatchByCreatedAt: ${JSON.stringify(filter)}`);
    }
  }

  const selector = {
    ...filter,
    [sortField]: {
      ...filter?.[sortField],
      $gt: greaterThan,
    },
  };

  const opts = {
    sort: getBatchSort<ObjectsByCollectionName[N]>(sortField),
    limit: batchSize,
    ...(projection ? { projection } : {})
  };

  return collection.find(selector, opts).fetch();
}

const getBatchProviders = (useCreatedAt: boolean) =>
  useCreatedAt
    ? {
      getFirst: getFirstBatchByCreatedAt,
      getNext: getNextBatchByCreatedAt,
    }
    : {
      getFirst: getFirstBatchById,
      getNext: getNextBatchById,
    };

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
export async function forEachDocumentBatchInCollection<N extends CollectionNameString>({
  collection,
  batchSize=1000,
  filter=null,
  projection,
  callback,
  loadFactor=1.0,
  useCreatedAt=false,
  overrideCreatedAt,
}: {
  collection: CollectionBase<N>,
  batchSize?: number,
  filter?: MongoSelector<ObjectsByCollectionName[N]> | null,
  projection?: MongoProjection<ObjectsByCollectionName[N]>,
  callback: (batch: ObjectsByCollectionName[N][]) => void | Promise<void>,
  loadFactor?: number,
  useCreatedAt?: boolean,
  overrideCreatedAt?: keyof ObjectsByCollectionName[N] & string
}): Promise<void> {
  const {getFirst, getNext} = getBatchProviders(useCreatedAt);
  let rows = await getFirst({collection, batchSize, filter, projection, overrideCreatedAt});
  while (rows.length > 0) {
    await runThenSleep(loadFactor, async () => {
      await timedFunc('migrationCallback', () => callback(rows));
      rows = await timedFunc('getNext', () => getNext({collection, batchSize, filter, projection, lastRows: rows, overrideCreatedAt}));
    });
  }
}

export async function forEachDocumentInCollection({collection, batchSize=1000, filter=null, callback, loadFactor=1.0}: {
  collection: any,
  batchSize?: number,
  filter?: MongoSelector<DbObject> | null,
  callback: Function,
  loadFactor?: number
}) {
  await forEachDocumentBatchInCollection({collection,batchSize,filter,loadFactor,
    callback: async (docs: any[]) => {
      for (let doc of docs) {
        await callback(doc);
      }
    }
  });
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
export async function forEachBucketRangeInCollection<N extends CollectionNameString>({collection, filter, bucketSize=1000, fn}: {
  collection: CollectionBase<N>
  filter?: MongoSelector<ObjectsByCollectionName[N]>
  bucketSize?: number
  fn: (selector: MongoSelector<ObjectsByCollectionName[N]>) => Promise<void>
})
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
  const bucketBoundaries = await collection.aggregate([
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

  // We can't assume that certain postgres functions exist because we may not have run the appropriate migration
  // This wraapper runs the function and ignores if it's not defined yet
export async function safeRun(db: SqlClient | null, fn: string): Promise<void> {
  if(!db) return;

  await db.any(`DO $$
    BEGIN
      PERFORM ${fn}();
    EXCEPTION WHEN undefined_function THEN
      -- Ignore if the function hasn't been defined yet; that just means migrations haven't caught up
    END;
  $$;`)
}
