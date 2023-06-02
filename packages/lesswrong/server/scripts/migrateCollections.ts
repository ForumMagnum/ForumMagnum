/* eslint-disable no-console */
import type { ITask } from "pg-promise";
import { Vulcan, getCollection, Globals } from "../vulcan-lib";
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import Table from "../../lib/sql/Table";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import CreateIndexQuery from "../../lib/sql/CreateIndexQuery";
import InsertQuery from "../../lib/sql/InsertQuery";
import SwitchingCollection from "../../lib/SwitchingCollection";
import type { ReadTarget, WriteTarget } from "../../lib/mongo2PgLock";
import omit from "lodash/omit";
import { ObjectId } from "mongodb";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import { LWEvents } from "../../lib/collections/lwevents";
import { inspect } from "util";
import { CollectionFilters } from './collectionMigrationFilters';
import { sleep, timedFunc } from "../../lib/helpers";
import Posts from "../../lib/collections/posts/collection";
import Users from "../../lib/collections/users/collection";
import { ClientIds } from "../../lib/collections/clientIds/collection";
import { createReadStream } from "fs";
import { once } from "events";
import { createInterface } from "readline";
import { writeFile } from "fs/promises";

type Transaction = ITask<{}>;

const extractObjectId = (value: Record<string, any>): Record<string, any> => {
  if (value._id instanceof ObjectId) {
    value._id = value._id.toString();
  }
  return value;
}


const sanitizeNullTerminatingChars = (value: DbRevision['originalContents']) => {
  if (value.type !== 'markdown') return value;
  value.data = value.data.replace(/\0/g, '');
  return value;
}

const VALID_ID_LENGTHS = new Set([17, 24]);

// Custom formatters to fix data integrity issues on a per-collection basis
// A place for nasty hacks to live...
const formatters: Partial<Record<CollectionNameString, (document: DbObject) => DbObject | Promise<DbObject | undefined>>> = {
  Posts: (post: DbPost): DbPost => {
    const scoreThresholds = [2, 30, 45, 75, 125, 200] as const;
    for (const threshold of scoreThresholds) {
      const prop: keyof DbPost = `scoreExceeded${threshold}Date`;
      if (typeof post[prop] === "boolean") {
        post[prop] = null;
      }
    }
    if (!post.title) {
      post.title = "";
    }
    return post;
  },
  Chapters: (chapter: DbChapter): DbChapter => {
    chapter.postIds ??= [];
    return chapter;
  },
  Migrations: (migration: DbMigration): DbMigration => {
    migration.finished ??= false;
    migration.succeeded ??= false;
    return migration;
  },
  Users: (user: DbUser): DbUser => {
    user.isAdmin = !!user.isAdmin;
    if (user.legacyData) {
      for (const field in user.legacyData) {
        const value = user.legacyData[field];
        if (typeof value === "string") {
          user.legacyData[field] = value.replace("\0", "");
        }
      }
    }

    if (user.emails && !Array.isArray(user.emails) && '0' in user.emails) {
      user.emails = Object.values(user.emails);
    }

    if (typeof user.banned === 'boolean') {
      user.banned = new Date('01-01-3023');
    }

    if (typeof user.needsReview !== 'boolean') {
      user.needsReview = false;
    }

    user.emails = user.emails?.map((email) => {
      return typeof email === "string"
        ? { address: email, verified: false }
        : email;
    });
    return user;
  },
  DebouncerEvents: (event: DbDebouncerEvents): DbDebouncerEvents => {
    extractObjectId(event);
    if (typeof event.createdAt === "number") {
      event.createdAt = new Date(event.createdAt);
    }
    if (typeof event.delayTime === "number") {
      event.delayTime = new Date(event.delayTime);
    }
    if (typeof event.upperBoundTime === "number") {
      event.upperBoundTime = new Date(event.upperBoundTime);
    }
    event.pendingEvents = (event.pendingEvents ?? []).filter(
      (item: any) => typeof item === "string",
    );
    event.createdAt ??= event.delayTime;
    return event;
  },
  DatabaseMetadata: (metadata: DbDatabaseMetadata): DbDatabaseMetadata => {
    extractObjectId(metadata);
    return metadata;
  },
  Spotlights: (spotlight: DbSpotlight): DbSpotlight => {
    extractObjectId(spotlight);
    if (!spotlight.hasOwnProperty('showAuthor')) {
      spotlight.showAuthor = false;
    }
    return spotlight;
  },
  Comments: (comment: DbComment): DbComment => {
    if (comment.contents?.originalContents) {
      comment.contents.originalContents = sanitizeNullTerminatingChars(comment.contents.originalContents);
    }
    return comment;
  },
  Messages: async (message: DbMessage): Promise<DbMessage | undefined> => {
    if (message.contents?.originalContents) {
      message.contents.originalContents = sanitizeNullTerminatingChars(message.contents.originalContents);
    }
    if (!VALID_ID_LENGTHS.has(message.userId.length)) {
      const maybeSlug = message.userId.toLowerCase();
      console.log(`Message with invalid userId ${maybeSlug}, checking if it's a slug`);
      const userBySlug = await Users.findOne({ slug: maybeSlug });
      if (userBySlug) {
        console.log(`Found user with slug ${maybeSlug}, id: ${userBySlug._id}`);
        message.userId = userBySlug._id;
      } else {
        // These cases are annoying to handle via collection query filters, so just filter them out here
        return undefined;
      }
    }
    return message;
  },
  Revisions: (revision: DbRevision): DbRevision => {
    if (revision.originalContents) {
      revision.originalContents = sanitizeNullTerminatingChars(revision.originalContents);
    }
    return revision;
  },
  ReadStatuses: async (readStatus: DbReadStatus): Promise<DbReadStatus | undefined> => {
    if (readStatus.postId && !VALID_ID_LENGTHS.has(readStatus.postId.length)) {
      const maybeSlug = readStatus.postId;
      if (maybeSlug !== 'null' && maybeSlug !== 'undefined') {
        console.log(`ReadStatus with invalid postId ${maybeSlug}, checking if it's a slug`);
        const postBySlug = await Posts.findOne({ slug: maybeSlug });
        if (postBySlug) {
          console.log(`Found post with slug ${maybeSlug}, id: ${postBySlug._id}`);
          readStatus.postId = postBySlug._id;
        } else {
          // These cases are annoying to handle via collection query filters, so just filter them out here
          return undefined;
        }
      } else {
        return undefined;
      }
    }
    return readStatus;
  },
  Votes: (vote: DbVote): DbVote => {
    if (typeof vote.userId !== 'string') {
      if (!('_str' in vote.userId)) {
        throw new Error(`Unrecognized vote userId: ${JSON.stringify(vote.userId)}`);
      }

      // @ts-ignore - LW had some legacy imported data where userId was an object shaped like { _str: string }
      vote.userId = vote.userId._str;
    }
    return vote;
  }
};

type DbObjectWithLegacyData = DbObject & {legacyData?: any};

const getLegacyData = (fieldNames: string[], data: DbObjectWithLegacyData) => {
  const legacyData = omit(data, fieldNames);
  return Object.keys(legacyData).length ? legacyData : undefined;
}

const getCollectionFormatter = (collection: SwitchingCollection<DbObject>) => {
  const fieldNames = Object.keys(collection.getPgCollection().table.getFields());
  const formatter = formatters[collection.getName()] ?? ((document: DbObject) => document);
  return (document: DbObjectWithLegacyData) => {
    const legacyData = getLegacyData(fieldNames, document);
    if (legacyData) {
      if (document.legacyData) {
        Object.assign(document.legacyData, legacyData);
      } else {
        document.legacyData = legacyData;
      }
    }
    return formatter(document);
  };
}

const createTables = async (sql: Transaction, collections: SwitchingCollection<DbObject>[]) => {
  console.log("...Creating tables");
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    if (!(table instanceof Table)) {
      throw new Error(`Collection '${collection.getName()}' does not have a valid table`);
    }
    const createQuery = new CreateTableQuery(table);
    const compiled = createQuery.compile();
    await sql.none(compiled.sql, compiled.args);
  }
}

const createIndexes = async (sql: Transaction, collections: SwitchingCollection<DbObject>[]) => {
  console.log("...Creating indexes");
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    const indexQueries = table.getIndexes().map((index) => new CreateIndexQuery(table, index));
    if (indexQueries.length === 0) {
      console.warn("...Warning: 0 indexes found: did you wait for the server timeout?");
    }
    for (const indexQuery of indexQueries) {
      const compiled = indexQuery.compile();
      await sql.none(compiled.sql, compiled.args);
    }
  }
}

const setLogged = async (sql: Transaction, collections: SwitchingCollection<DbObject>[], logged: boolean) => {
  console.log("...Making tables logged");
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    await sql.none(`ALTER TABLE "${table.getName()}" SET ${logged ? "LOGGED" : "UNLOGGED"}`);
  }
}

const pickBatchSize = (collection: SwitchingCollection<DbObject>) => {
  // The Postgres protocol stores parameter indexes as a U16, so there can't be more than 65535
  // arguments in a single query. We use this to make the largest batch size possible based off
  // of the number of fields in the schema.
  const max = 65535;
  const numFields = collection.getTable().countFields();
  return Math.floor(max / numFields);
}

const makeBatchFilter = (collectionName: string, createdSince?: Date) => {
  if (!createdSince) {
    return {};
  }

  switch (collectionName) {
    case 'cronHistory': return { startedAt: { $gte: createdSince } };
    // It seems like we create cookies that expire after 10 years, by default?
    case 'Sessions': return { expires: { $gte: createdSince.setUTCFullYear(createdSince.getUTCFullYear() + 10) } };
    default: return { createdAt: { $gte: createdSince } };
  }
}

const makeCollectionFilter = (collectionName: string) => {
  switch (collectionName) {
    case "DatabaseMetadata":
      return { name: { $nin: ["databaseId", "expectedDatabaseId"] } };
    case "Books":
      return CollectionFilters['Books'];
    case "Sequences":
      return CollectionFilters['Sequences'];
    case "Collections":
      return { deleted: { $ne: true } };
    case "Messages":
      return { contents: { $exists: true } };
    case "CronHistories":
      return { intendedAt: { $ne: null } };
    case "DebouncerEvents":
      return { upperBoundTime: { $ne: NaN } };
    default:
      return {};
  }
}

const isNonIdSortField = (collectionName: string) => {
  switch (collectionName) {
    case 'EmailTokens': return false;
    case 'Posts': return false;
    case 'ReadStatuses': return false;
    case 'CronHistories': return false;
    case 'Images': return false;
    default: return true;
  }
};

const getCollectionSortField = (collectionName: string) => {
  switch (collectionName) {
    case 'DebouncerEvents': return 'delayTime';
    case 'Migrations': return 'started';
    case 'Votes': return 'votedAt';
    case 'Sessions': return 'expires';
    default: return 'createdAt';
  }
};

const copyDatabaseId = async (sql: Transaction) => {
  const databaseId = await DatabaseMetadata.findOne({name: "databaseId"});
  const expectedDatabaseId = await DatabaseMetadata.findOne({name: "expectedDatabaseId"});
  if (databaseId) {
    extractObjectId(databaseId);
    await sql.none(`
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value")
      VALUES ($1, $2, TO_JSONB($3::TEXT))
      ON CONFLICT (COALESCE("name", ''::TEXT)) DO UPDATE
      SET "value" = TO_JSONB($3::TEXT)
    `, [databaseId._id, databaseId.name, databaseId.value]);
  }

  if (expectedDatabaseId) {
    extractObjectId(expectedDatabaseId);
    await sql.none(`
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value")
      VALUES ($1, $2, TO_JSONB($3::TEXT))
      ON CONFLICT (COALESCE("name", ''::TEXT)) DO UPDATE
      SET "value" = TO_JSONB($3::TEXT)
    `, [expectedDatabaseId._id, expectedDatabaseId.name, expectedDatabaseId.value]);
  }
}

const copyData = async (
  sql: Transaction,
  collections: SwitchingCollection<DbObject>[],
  pass: number,
  createdSince?: Date,
) => {
  console.log(`...Copying data (pass ${pass})`);
  if (createdSince) {
    console.log(`...(using createdSince = ${createdSince})`);
  }
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    const collectionName = collection.getMongoCollection().collectionName;

    // const totalCount = await collection.getMongoCollection().find({
    //   ...(createdSince ? { createdAt: {$gte: createdSince} } : {}),
    // }).count();

    // if (totalCount < 1) {
    //   continue;
    // }

    const formatter = getCollectionFormatter(collection);
    const batchSize = 500;// pickBatchSize(collection);
    const nonIdSortField = isNonIdSortField(collectionName);
    const sortField = getCollectionSortField(collectionName);
    let count = 0;
    await forEachDocumentBatchInCollection({
      collection: collection.getMongoCollection() as unknown as CollectionBase<DbObject>,
      batchSize,
      useCreatedAt: nonIdSortField,
      overrideCreatedAt: sortField as keyof DbObject,
      filter: {
        ...makeBatchFilter(collectionName, createdSince),
        ...makeCollectionFilter(collectionName),
      },
      callback: async (documents: DbObject[]) => {
        const end = count + documents.length;
        console.log(`.........Migrating '${collection.getName()}' documents ${count}-${end} of ${'???'}`);
        count += batchSize;
        const formattedDocuments = (await Promise.all(documents.map(formatter))).filter((doc): doc is DbObject => !!doc);
        const query = new InsertQuery(table, formattedDocuments, {}, {conflictStrategy: "ignore"});
        const compiled = query.compile();
        try {
          await timedFunc('sql.none', () => sql.none(compiled.sql, compiled.args));
        } catch (e) {
          console.log(documents);
          console.error(e);
          throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
        }
      },
    });

    if (collectionName === "DatabaseMetadata") {
      await copyDatabaseId(sql);
    }
  }
}

/**
 * Write new collection targets to the lock and propogate to the live server instances.
 * Note that this uses the global SQL client, not the migration transaction.
 */
const writeCollectionTargets = async (
  collections: SwitchingCollection<DbObject>[],
  readTarget: ReadTarget,
  writeTarget: WriteTarget,
): Promise<void> => {
  await Promise.all(collections.map((collection) => {
    collection.setTargets(readTarget, writeTarget);
    return collection.writeToLock();
  }));

  // Wait for propogation
  return new Promise((resolve) => {
    setTimeout(resolve, 3 * SwitchingCollection.POLL_RATE_SECONDS);
  });
}

export const migrateCollections = async (collectionNames: CollectionNameString[], maxCopyAge?: Date, passTx?: (transaction: ITask<{}>) => Promise<void>) => {
  console.log(`=== Migrating collections '${collectionNames}' from Mongo to Postgres ===`);

  console.log("...Preparing collections");
  const collections = collectionNames.map(getCollection) as unknown as SwitchingCollection<DbObject>[];
  for (const [index, collection] of collections.entries()) {
    if (!collection) {
      throw new Error(`Invalid collection name '${collectionNames[index]}'`);
    }
    if (!(collection instanceof SwitchingCollection)) {
      throw new Error(`Collection '${collectionNames[index]}' is not a SwitchingCollection`);
    }
  }

  // This should already be the case, but make sure
  await writeCollectionTargets(collections, "mongo", "mongo");

  console.log("...Beginning SQL transaction");
  const sql = getSqlClientOrThrow();
  try {
    await sql.tx(async (transaction) => {
      // Create the tables
      await createTables(transaction, collections);
      if (!passTx) await createIndexes(transaction, collections);
      await setLogged(transaction, collections, false);

      // Copy the initial data - this can take a *long* time depending on the collection
      const copyStart = new Date();
      await copyData(transaction, collections, 1, maxCopyAge);
      if (passTx) {
        await passTx?.(transaction);
        await createIndexes(transaction, collections);
      }
      await setLogged(transaction, collections, true);

      // Copy anything that was inserted during the first copy - this should be ~instant
      const copyStart2 = new Date();
      await copyData(transaction, collections, 2, copyStart);

      // Start writing to Postgres
      await writeCollectionTargets(collections, "mongo", "pg");

      // Once more for luck...
      await copyData(transaction, collections, 3, copyStart2);
    });

    // Fully move to Postgres and write the lock in case the server restarts at some point
    await writeCollectionTargets(collections, "pg", "pg");

    console.log("\ud83c\udfc1 Done!");
    return true;
  } catch (e) {
    console.error("Error:", e.message);
    await writeCollectionTargets(collections, "mongo", "mongo");
    console.log("\ud83d\uded1 Migration aborted!");
    return false;
  }
}

Vulcan.migrateCollections = migrateCollections;

const migrateLWEvents = async (resumeTime?: Date, overrideStartTime?: Date, fromFile?: boolean, resumeLine?: number) => {
  if (!resumeTime && !resumeLine) {
    const startTime = overrideStartTime ?? new Date();
    const success = await migrateCollections(["LWEvents"], startTime);
    if (!success) {
      return;
    }
  }

  const collection = LWEvents;
  if (!(collection instanceof SwitchingCollection)) {
    throw new Error("LWEvents is not a switching collection");
  }

  if (fromFile) {
    await migrateFromFile(collection, resumeLine);
  } else {
    const oldest = await collection.getMongoCollection().find({}, {
      sort: {createdAt: 1},
      limit: 1,
      projection: {createdAt: 1},
    }).fetch();
  
    if (oldest.length !== 1) {
      throw new Error("Can't find oldest event");
    }
  
    const oldestCreatedAt = oldest[0].createdAt;
  
    // eslint-disable-next-line no-console
    console.log("Oldest event created at", oldestCreatedAt);

    const sql = getSqlClientOrThrow();

    const windowSizeMonths = 3;
    const windowSizeMS = windowSizeMonths * 31 * 24 * 60 * 60 * 1000;
    let maxTime = resumeTime ?? new Date();
    while (maxTime > oldestCreatedAt) {
      const minTime = new Date(maxTime.getTime() - windowSizeMS);
      const filter = {
        createdAt: {
          $gt: minTime,
          $lte: maxTime,
        },
      };
  
      console.log(`...Migrating LWEvents batch: ${inspect(filter)}`);
  
      const table = collection.getPgCollection().table;
      const collectionName = collection.getMongoCollection().collectionName;
  
      const totalCount = await collection.getMongoCollection().find(filter).count();
      if (totalCount < 1) {
        // eslint-disable-next-line no-console
        console.log("No documents in batch - skipping...");
        maxTime = minTime;
        continue;
      }
  
      const formatter = getCollectionFormatter(collection);
      const batchSize = pickBatchSize(collection);
      let count = 0;
      await forEachDocumentBatchInCollection({
        collection: collection.getMongoCollection() as unknown as CollectionBase<DbObject>,
        batchSize,
        useCreatedAt: true,
        filter: {
          ...makeCollectionFilter(collectionName),
          ...filter,
        },
        callback: async (documents: DbObject[]) => {
          const end = count + documents.length;
          console.log(`.........Migrating '${collection.getName()}' documents ${count}-${end} of ${totalCount}`);
          count += batchSize;
          const query = new InsertQuery(table, documents.map(formatter), {}, {conflictStrategy: "ignore"});
          const compiled = query.compile();
          try {
            await sql.none(compiled.sql, compiled.args);
          } catch (e) {
            console.log(documents);
            console.error(e);
            throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
          }
        },
      });
  
      maxTime = minTime;
    }
  }
}

Vulcan.migrateLWEvents = migrateLWEvents;

const migrateClientIds = async (lastDate?: Date, fileOffset?: boolean) => {
  const start = new Date();
  if (!lastDate) {
    throw new Error("Last LWEvent createdAt required");
  }

  if (!fileOffset) {
    const success = await migrateCollections(["LWEvents"], lastDate, undefined);
    if (!success) {
      return;
    }
  }

  const sql = getSqlClientOrThrow();

  // , async (transaction) => {
  const collection = LWEvents;
  if (!(collection instanceof SwitchingCollection)) {
    throw new Error("LWEvents is not a switching collection");
  }

  const table = collection.getPgCollection().table;
  const formatter = getCollectionFormatter(collection);

  const batch: DbClientId[] = [];
  const inStream = createReadStream('./lwevents.json');
  let count = 0;
  let strLen = 0;
  const maxStrLen = Math.pow(2, 27);

  await once(inStream, 'open');
  const rl = createInterface({
    input: inStream
  });

  for await (const line of rl) {
    try {
      const parsedRecord = JSON.parse(line);
      if (!('createdAt' in parsedRecord)) {
        console.log({ parsedRecord }, 'Missing createdAt field');
        continue;
      }
      parsedRecord.createdAt = new Date(parsedRecord.createdAt['$date']);
      if (isNaN(parsedRecord.createdAt)) {
        throw new Error(`Invalid date from line ${line}`);
      }

      if (fileOffset && parsedRecord.createdAt < lastDate) {
        continue;
      }

      if (typeof parsedRecord._id === 'string') {

      } else if (typeof parsedRecord._id === 'object') {
        if ('$oid' in parsedRecord._id) {
          parsedRecord._id = parsedRecord._id['$oid'];
        } else {
          console.log({ parsedRecord }, 'Got a record with an object _id without an $oid!');
          continue;
          // throw new Error();
        }
      } else {
        console.log({ parsedRecord }, 'Got a record with an _id which is neither a string nor an object!');
        continue;
        // throw new Error();
      }  
      batch.push(parsedRecord);
      count++;
      strLen += line.length;

      if (strLen >= maxStrLen || batch.length >= 6000) {
        const query = new InsertQuery(table, await Promise.all(batch.map(formatter)), {}, {conflictStrategy: "ignore"});
        const compiled = query.compile();
        try {
          await timedFunc('sql.none', () => sql.none(compiled.sql, compiled.args));
          // await sleep(300);
        } catch (e) {
          console.log(batch);
          console.error(e);
          throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
        }
        console.log(`Migrated ${count} lwEvents from file with batch size ${batch.length} and strLen ${strLen} (estimated)`);
        batch.length = 0;
        strLen = 0;
      }
    } catch (err) {
      console.log({ err });
      throw new Error(err);
    }
  }

  const query = new InsertQuery(table, await Promise.all(batch.map(formatter)), {}, {conflictStrategy: "ignore"});
  const compiled = query.compile();
  try {
    await timedFunc('sql.none', () => sql.none(compiled.sql, compiled.args));
  } catch (e) {
    console.log(batch);
    console.error(e);
    throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
  }
  console.log(`Migrated ${count} records from file`);
  batch.length = 0;

  await sql.task(async (t) => {
    await createIndexes(t, [collection]);
    await setLogged(t, [collection], true);
  });
  // });
}

Globals.migrateClientIds = migrateClientIds;

const migrateFromFile = async (collection: SwitchingCollection<any>, resumeLine?: number) => {
  const sql = getSqlClientOrThrow();

  const table = collection.getPgCollection().table;
  const formatter = getCollectionFormatter(collection);

  const batch: DbLWEvent[] = [];
  const inStream = createReadStream('./lwevents-prod.json');
  let count = 0;
  let skipCount = 0;
  let strLen = 0;
  let deletedHtmlLen = 0;
  const maxStrLen = Math.pow(2, 27);

  await once(inStream, 'open');
  const rl = createInterface({
    input: inStream
  });

  for await (let line of rl) {
    skipCount++;
    if (skipCount % 5_000_000 === 0) {
      console.log(`Scanned ${skipCount} lines`);
    }

    if (resumeLine && skipCount < resumeLine) {
      continue;
    }
    try {
      const parsedRecord = JSON.parse(line);
      if (parsedRecord._id === 'd9dd56Q27CCNBPKZA') {
        continue;
      }
      if (!('createdAt' in parsedRecord)) {
        console.log({ parsedRecord }, 'Missing createdAt field');
        continue;
      }
      parsedRecord.createdAt = new Date(parsedRecord.createdAt['$date']);
      if (isNaN(parsedRecord.createdAt)) {
        throw new Error(`Invalid date from line ${line}`);
      }

      if (typeof parsedRecord._id === 'string') {

      } else if (typeof parsedRecord._id === 'object') {
        if ('$oid' in parsedRecord._id) {
          parsedRecord._id = parsedRecord._id['$oid'];
        } else {
          console.log({ parsedRecord }, 'Got a record with an object _id without an $oid!');
          continue;
          // throw new Error();
        }
      } else {
        console.log({ parsedRecord }, 'Got a record with an _id which is neither a string nor an object!');
        continue;
        // throw new Error();
      }

      if (parsedRecord.name === 'emailSent') {
        deletedHtmlLen += parsedRecord.properties?.html?.length ?? 0;
        delete parsedRecord.properties?.html;
      }
      
      batch.push(parsedRecord);
      count++;
      strLen += line.length;

      if (strLen >= maxStrLen || batch.length >= 6000) {
        const query = new InsertQuery(table, await Promise.all(batch.map(formatter)), {}, {conflictStrategy: "ignore"});
        const compiled = query.compile();
        try {
          await timedFunc('sql.none', () => sql.none(compiled.sql, compiled.args));
          // await sleep(300);
        } catch (e) {
          console.log(batch);
          await writeFile('failed-lwevents.json', JSON.stringify(batch));
          console.error(e);
          throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
        }
        console.log(`Migrated ${count} lwEvents from file with batch size ${batch.length} and strLen ${strLen} (estimated), minus ${deletedHtmlLen} for deleted html`);
        batch.length = 0;
        strLen = 0;
        deletedHtmlLen = 0;
      }
    } catch (err) {
      console.log({ err });
      throw new Error(err);
    }
  }

  const query = new InsertQuery(table, await Promise.all(batch.map(formatter)), {}, {conflictStrategy: "ignore"});
  const compiled = query.compile();
  try {
    await timedFunc('sql.none', () => sql.none(compiled.sql, compiled.args));
  } catch (e) {
    console.log(batch);
    console.error(e);
    throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
  }
  console.log(`Migrated ${count} records from file`);
  batch.length = 0;
};
