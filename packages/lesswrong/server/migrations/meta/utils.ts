import TableIndex from "@/server/sql/TableIndex";
import { postgresExtensions } from "../../postgresExtensions";
import { postgresFunctions } from "../../postgresFunctions";
import type { ITask } from "pg-promise";
import { JsonType, Type } from "@/server/sql/Type";
import type { PostgresView } from "../../postgresView";
import { sleep } from "../../../lib/utils/asyncUtils";
import { getAdminTeamAccount } from "@/server/utils/adminTeamAccount";
import { undraftPublicPostRevisions } from "@/server/manualMigrations/2024-08-14-undraftPublicRevisions";
import chunk from "lodash/chunk";
import { getLatestRev } from "@/server/editor/utils";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { getAllIndexes } from "@/server/databaseIndexes/allIndexes";
import { getCollection } from "@/server/collections/allCollections";
import { createAdminContext, createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { buildRevision } from "@/server/editor/conversionUtils";
import { createRevision } from "@/server/collections/revisions/mutations";
import PgCollectionClass from "@/server/sql/PgCollection";
import CreateIndexQuery from "@/server/sql/CreateIndexQuery";
import CreateTableQuery from "@/server/sql/CreateTableQuery";

type SqlClientOrTx = SqlClient | ITask<{}>;

function getCollectionFromNameOrCollection<N extends CollectionNameString>(
  collectionOrCollectionName: CollectionBase<N>|string,
): CollectionBase<N> {
  const collection = (typeof collectionOrCollectionName === "string")
    ? getCollection(collectionOrCollectionName as CollectionNameString)
    : collectionOrCollectionName;
  if (!collection) {
    throw new Error(`Collection "${collectionOrCollectionName}" not found`);
  }
  return collection as CollectionBase<N>;
}

function getPgCollectionFromNameOrCollection<N extends CollectionNameString>(
  collectionOrCollectionName: PgCollectionClass<N>|string,
): PgCollectionClass<N> {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  if (!(collection instanceof PgCollectionClass)) {
    throw new Error(`Collection "${collectionOrCollectionName}" is not a Postgres collection`);
  }
  return collection as PgCollectionClass<N>;
}

export const addField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  const table = collection.getTable();
  const fieldType = table.getFields()[fieldName];
  if (!fieldType) {
    throw new Error(`Field "${fieldName}" does not exist in the schema`);
  }
  await db.none("ALTER TABLE $1 ADD COLUMN IF NOT EXISTS $2 $3", [table.getName(), fieldName, fieldType.toString()]);
}

/**
 * WARNING: Please use addField instead (if possible)!
 *
 * This is the same as addField, just typed differently to handle the case
 * when the field is not currently in the schema (ex. it was subsequently removed).
 */
export const addRemovedField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
  fieldType: Type,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none(`ALTER TABLE "${collection.getTable().getName()}" ADD COLUMN IF NOT EXISTS "${fieldName}" ${fieldType.toString()}`);
}

export const dropField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  // Not typed as being a key of this collection, because if this isn't for a
  // down-migration, it'll have been removed from the schema
  fieldName: string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none(`ALTER TABLE "${collection.getTable().getName()}" DROP COLUMN IF EXISTS "${fieldName}" CASCADE`);
}

/**
 * WARNING: Please use dropField instead (if possible)!
 *
 * This is the same as dropField, just typed differently to handle the case
 * when the field is not currently in the schema (ex. it was subsequently removed).
 */
export const dropRemovedField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none(`ALTER TABLE "${collection.getTable().getName()}" DROP COLUMN IF EXISTS "${fieldName}" CASCADE`);
}

export const updateDefaultValue = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  const table = collection.getTable();
  const fields = table.getFields();
  if (!fields[fieldName]) {
    throw new Error(`Table does not have field ${fieldName}`)
  }
  const defaultValue = fields[fieldName].getDefaultValueString();
  await db.none("ALTER TABLE $1 ALTER COLUMN $2 $3", [table.getName(), fieldName, defaultValue ? `SET DEFAULT ${defaultValue}` : "DROP DEFAULT"]);
}

export const dropDefaultValue = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  const table = collection.getTable();
  const fields = table.getFields();
  if (!fields[fieldName]) {
    throw new Error(`Table does not have field ${fieldName}`)
  }
  await db.none("ALTER TABLE $1 ALTER COLUMN $2 DROP DEFAULT", [table.getName(), fieldName]);
}

export const updateFieldType = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  const fieldType = collection.getTable().getFields()[fieldName];
  await db.none(
    `ALTER TABLE "${collection.getTable().getName()}" ALTER COLUMN "${fieldName}" TYPE ${fieldType.toConcrete().toString()}`
  );
}

export const dropIndex = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  index: TableIndex<ObjectsByCollectionName[N]>,
): Promise<void> => {
  getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none(`DROP INDEX IF EXISTS "${index.getName()}"`);
}

export const dropIndexByName = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  indexName: string
): Promise<void> => {
  getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none(`DROP INDEX IF EXISTS "${indexName}"`);
}

export const createIndex = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  index: TableIndex<ObjectsByCollectionName[N]>,
  ifNotExists = true,
  allowConcurrent = true,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  const {sql, args} = new CreateIndexQuery({ table: collection.getTable(), index, ifNotExists, allowConcurrent }).compile();
  await db.none(sql, args);
}

export const dropTable = async (db: SqlClientOrTx, collectionOrCollectionName: CollectionBase<any>|string): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none("DROP TABLE IF EXISTS $1", [collection.getTable().getName()]);
}

export const createTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: PgCollectionClass<N>|string,
  ifNotExists = true,
): Promise<void> => {
  const collection = getPgCollectionFromNameOrCollection(collectionOrCollectionName);
  const table = collection.getTable();
  const {sql, args} = new CreateTableQuery(table, ifNotExists).compile();
  await db.none(sql, args);
  await updateIndexes(collection);
}

export const unlogTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none("ALTER TABLE $1 SET UNLOGGED", [collection.getTable().getName()]);
}

export const logTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
): Promise<void> => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  await db.none("ALTER TABLE $1 SET LOGGED", [collection.getTable().getName()]);
}

export const installExtensions = async (db: SqlClientOrTx) => {
  for (const extension of postgresExtensions) {
    await db.none(`CREATE EXTENSION IF NOT EXISTS "${extension}" CASCADE`);
  }
}

export const updateFunctions = async (db: SqlClientOrTx) => {
  for (const func of postgresFunctions) {
    await db.none(func.source);
  }
}

export const updateIndexes = async <N extends CollectionNameString>(
  collectionOrCollectionName: PgCollectionClass<N>|string,
): Promise<void> => {
  const collection = getPgCollectionFromNameOrCollection(collectionOrCollectionName);
  const allIndexes = getAllIndexes();
  const indexesOnCollection = allIndexes.mongoStyleIndexes[collection.collectionName];
  for (const index of indexesOnCollection ?? []) {
    if (!collection.getTable()) {
      collection.buildPostgresTable();
    }
    await collection._ensureIndex(index.key, index.options);
    await sleep(100);
  }
}

export const updateCustomIndexes = async (db: SqlClientOrTx) => {
  const allIndexes = getAllIndexes();
  const customPgIndexes = allIndexes.customPgIndexes;
  for (const index of customPgIndexes) {
    await db.none(index.source);
    await sleep(100);
  }
}

export const updateView = async (db: SqlClientOrTx, view: PostgresView) => {
  const query = view.getCreateViewQuery();
  await db.none(query);
  await sleep(100);
  for (const index of view.getCreateIndexQueries()) {
    await db.none(index);
    await sleep(100);
  }
}

function getInitialVersion(document: CreateInputsByCollectionName[CollectionNameString]['data'] | ObjectsByCollectionName[CollectionNameString]) {
  if ((document as CreatePostDataInput).draft) {
    return '0.1.0'
  } else {
    return '1.0.0'
  }
}

// Exported to allow running manually with "yarn repl"
export const normalizeEditableField = async ({ db: maybeDb, collectionName, fieldName, dropField }: {
  db?: SqlClientOrTx,
  collectionName: CollectionNameString,
  fieldName: string,
  dropField: boolean
}) => {
  const db = maybeDb ?? getSqlClientOrThrow();
  const collection = getCollection(collectionName);
  const context = createAdminContext();

  // First, check if the field is already normalized - this will be the
  // case if we're running the migration on a new forum instance that's been
  // created from a newer version of the schema. In this case we should just
  // early-return without an error.
  const columnInfo = await db.oneOrNone(`
    SELECT *
    FROM information_schema.columns
    WHERE
      table_schema = 'public'
      AND table_name = '${collectionName}'
      AND column_name = '${fieldName}'
  `);
  if (!columnInfo) {
    return;
  }

  // Find any documents where the latest revision id is null and create a
  // new revision for them
  const latestFieldName = `${fieldName}_latest`;
  const documents = await collection.find({
    [latestFieldName]: {$exists: false},
  }).fetch();
  const documentBatches = chunk(documents, 20);
  let existingRevUsed = 0;
  let revCreated = 0;
  const currentUser = await getAdminTeamAccount(context);
  if (!currentUser) {
    throw new Error("Can't find admin user account");
  }

  for (let i = 0; i < documentBatches.length; i++) {
    // eslint-disable-next-line no-console
    console.log(`Backfilling missing revisions for batch ${i} of ${documentBatches.length}... (${existingRevUsed} reused, ${revCreated} created)`);

    const batch = documentBatches[i];

    await Promise.all(batch.map(async (document) => {
      const editableField: (EditableFieldContents & EditableFieldUpdate) | undefined =
        (document as AnyBecauseHard)[fieldName];
      if (!editableField) {
        return;
      }

      try {
        const existingLatestRev = await getLatestRev(document._id, "contents", context);
        if (
          existingLatestRev
          && existingLatestRev?.html === editableField?.html
          && !existingLatestRev.draft
        ) {
          existingRevUsed++;
          await collection.rawUpdateOne({_id: document._id}, {
            $set: {[latestFieldName]: existingLatestRev._id},
          })
        } else {
          const dataWithDiscardedSuggestions = editableField?.dataWithDiscardedSuggestions;
          delete editableField?.dataWithDiscardedSuggestions;
    
          const userId = (document as AnyBecauseHard).userId || currentUser._id;
    
          const revisionData = editableField.originalContents
            ? await buildRevision({
              originalContents: editableField.originalContents,
              dataWithDiscardedSuggestions,
              currentUser,
              context,
            })
            : {
              html: "",
              wordCount: 0,
              originalContents: {type: "ckEditorMarkup", data: "", yjsState: null},
              editedAt: new Date(),
              userId,
            };
    
          revCreated++;
          const revision = await createRevision({
            data: {
              version: editableField.version || getInitialVersion(document),
              changeMetrics: {added: 0, removed: 0},
              collectionName,
              ...revisionData,
              userId,
            }
          }, createAnonymousContext());
    
          await collection.rawUpdateOne(
            {_id: document._id},
            { $set: {[latestFieldName]: revision._id}, }
          );
        }
      } catch(e) {
        // eslint-disable-next-line no-console
        console.log(`Failed on post with ID ${document._id}`);
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }));
  }

  // Check for data integrity issues and update any revisions that have diverged
  // from the current denormalized value
  // eslint-disable-next-line no-console
  console.log("Updating out-of-sync revisions...");
  await db.none(`
    UPDATE "Revisions" AS r
    SET
      "html" = COALESCE(p."${fieldName}"->>'html', r."html"),
      -- Don't update userId as there are data integrity issues (see Github PR #9213)
      -- "userId" = COALESCE(p."${fieldName}"->>'userId', r."userId"),
      "version" = COALESCE(p."${fieldName}"->>'version', r."version"),
      "editedAt" = COALESCE((p."${fieldName}"->>'editedAt')::TIMESTAMPTZ, r."editedAt"),
      "wordCount" = COALESCE((p."${fieldName}"->>'wordCount')::INTEGER, r."wordCount"),
      "updateType" = COALESCE(p."${fieldName}"->>'updateType', r."updateType"),
      "commitMessage" = COALESCE(p."${fieldName}"->>'commitMessage', r."commitMessage"),
      "originalContents" = COALESCE(p."${fieldName}"->'originalContents', r."originalContents"),
      "draft" = COALESCE(p."draft", FALSE),
      "collectionName" = $1
    FROM "${collectionName}" AS p
    WHERE
      r."collectionName" = $1
      AND r."fieldName" = '${fieldName}'
      AND p."${fieldName}_latest" = r."_id"
      AND p."${fieldName}"->>'html' <> r."html"
  `, [collectionName]);

  if (dropField) {
    // eslint-disable-next-line no-console
    console.log("Dropping denormalized field...");
    await dropRemovedField(db, collection, fieldName);
  }

  // eslint-disable-next-line no-console
  console.log("Undrafting most recent revisions for published posts...");
  await undraftPublicPostRevisions(db);
}

// Exported to allow running manually with "yarn repl"
export const denormalizeEditableField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collectionOrCollectionName: CollectionBase<N>|string,
  fieldName: string,
) => {
  const collection = getCollectionFromNameOrCollection(collectionOrCollectionName);
  const {collectionName} = collection;
  await addRemovedField(db, collection, fieldName, new JsonType());
  await db.none(`
    UPDATE "${collectionName}" AS p
    SET "${fieldName}" = JSONB_BUILD_OBJECT(
      'html', r."html",
      'userId', r."userId",
      'version', r."version",
      'editedAt', r."editedAt",
      'wordCount', r."wordCount",
      'updateType', r."updateType",
      'commitMessage', r."commitMessage",
      'originalContents', r."originalContents"
    )
    FROM "Revisions" AS r
    WHERE
      r."collectionName" = '${collectionName}'
      AND r."fieldName" = '${fieldName}'
      AND p."${fieldName}_latest" = r."_id"
  `);
};


