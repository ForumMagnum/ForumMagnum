import { randomId } from './random';
import { mongoSelectorToSql, mongoFindOptionsToSql, mongoModifierToSql } from './mongoToPostgres';
import { Globals } from './vulcan-lib/config';
import { getCollection } from './vulcan-lib/getCollection';
import { getSchema } from './utils/getSchema';

let client: any = null;
let db: any = null;
export const setDatabaseConnection = (_client, _db) => {
  client = _client;
  db = _db;
}
let postgresConnectionPool: any = null;
export const setPostgresConnection = (connectionPool) => {
  postgresConnectionPool = connectionPool;
}
export const getDatabase = () => db;
export const getMongoClient = () => client
export const databaseIsConnected = () => (db !== null);
export const closeDatabaseConnection = () => {
  if (client) {
    client.close();
    client = null;
    db = null;
  }
}
export const isAnyQueryPending = () => (inProgressQueries > 0);

const disableAllWrites = false;
const logQueries = false;
const debugQueryBatches = false;
let inProgressQueries = 0;
let onBatchFinished: Promise<void>|null = null;
let finishBatch: any = null;

function timeSince(startTime: Date): string {
  const now = new Date();
  const msElapsed = now.getTime() - startTime.getTime();
  return `${msElapsed}ms`;
}

async function wrapQuery(description, queryFn) {
  const startTime = new Date();
  if (logQueries) {
    // eslint-disable-next-line no-console
    console.log(`Starting ${description}`);
    
    if (inProgressQueries == 0) {
      onBatchFinished = new Promise((resolve, reject) => {
        finishBatch = resolve;
      });
    }
  }
  
  inProgressQueries++;
  const result = await queryFn();
  inProgressQueries--;
  
  if (logQueries) {
    const resultSize = JSON.stringify(result).length;
    // eslint-disable-next-line no-console
    console.log(`Finished  ${description} (${timeSince(startTime)}, ${resultSize}b)`);
    
    if (debugQueryBatches) {
      await waitForBatchFinished();
    }
  }
  return result;
}
async function waitForBatchFinished() {
  if (inProgressQueries === 0) {
    let finish = finishBatch;
    onBatchFinished = null;
    finishBatch = null;
    // eslint-disable-next-line no-console
    console.log('================================');
    finish();
  } else {
    await onBatchFinished;
  }
}

function removeUndefinedFields(selector: any) {
  const filtered: any = {};
  for (let key in selector) {
    if (typeof selector[key] !== "undefined") {
      filtered[key] = selector[key];
    }
  }
  return filtered;
}

function postgresRowToMongo<T extends DbObject>(collection: CollectionBase<T>, row: any) {
  const result = {
    _id: row.id,
    ...row.json,
  };
  const schema = collection._schemaFields;
  for (let key of Object.keys(schema)) {
    if (schema[key].type === Date) {
      const untranslatedDate = result[key];
      result[key] = untranslatedDate ? new Date(untranslatedDate) : untranslatedDate ;
    }
  }
  
  // HACK: Convert editedAt in denormalized content-editable fields to date.
  if (result?.contents?.editedAt)
    result.contents.editedAt = new Date(result.contents.editedAt);
  if (result?.moderationGuidelines?.editedAt)
    result.moderationGuidelines.editedAt = new Date(result.moderationGuidelines.editedAt);
  
  return result;
}

Globals.testTranslateQuery = (collectionName: CollectionNameString, selector: any, options: any) => {
  const collection = getCollection(collectionName);
  const tableName = (collection as any).tableName;
  const {sql, arg} = mongoSelectorToSql(collection, selector, 1);
  const {sql: optionsSql, arg: optionsArg} = mongoFindOptionsToSql(collection, options);
}
Globals.testTranslateAndRunQuery = async (collectionName: CollectionNameString, selector: any, options: any) => {
  const collection = getCollection(collectionName);
  const tableName = (collection as any).tableName;
  const {sql: queryFragment, arg: queryArgs} = mongoSelectorToSql(collection, selector, 1);
  const {sql: optionsFragment, arg: optionsArgs} = mongoSelectorToSql(collection, selector, 1);
  const {sql: optionsSql, arg: optionsArg} = mongoFindOptionsToSql(collection, options);
  const query = `select * from ${tableName} where ${queryFragment} ${optionsSql}`;
  
  
  await postgresConnectionPool.any(query, queryArgs);
}

export class MongoCollection<T extends DbObject, N extends CollectionNameString> implements CollectionBase<T,N>{
  tableName: string
  table: any
  
  collectionName: N
  typeName: string
  options: CollectionOptions
  checkAccess: (user: DbUser|null, obj: T, context: ResolverContext|null) => Promise<boolean>
  getParameters: (terms: ViewTermsByCollectionName[N], apolloClient?: any, context?: ResolverContext) => MergedViewQueryAndOptions<N,T>
  _schemaFields: SchemaType<T>
  _simpleSchema: any
  
  constructor(tableName: string, options?: {
    _suppressSameNameError?: boolean // Used only by Meteor; disables warning about name conflict over users collection
  }) {
    this.tableName = tableName;
  }
  
  getConnectionPool = () => {
    if (bundleIsServer) {
      if (!postgresConnectionPool)
        throw new Error("No database connection");
      return postgresConnectionPool;
    } else {
      throw new Error("Attempted to run mongodb query on the client");
    }
  }
  
  runQuery = async (query: string, args: any[]): Promise<any> => {
    const pool = await this.getConnectionPool();
    const startTime = new Date();
    let result;
    try {
      result = await pool.query(query, this.translatePgArgs(args));
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log(`Postgres query FAILED: ${query} (${JSON.stringify(args)})`);
      // eslint-disable-next-line no-console
      console.log(e);
      throw e;
    }
    const timeElapsed = new Date().getTime()-startTime.getTime();
    // eslint-disable-next-line no-console
    console.log(`Postgres query: ${query} (${JSON.stringify(args)}) (${result?.length} rows, ${timeElapsed}ms)`);
    return result;
  }
  
  translatePgArgs = (args: any[]): any[] => {
    let result = [...args];
    for (let i=0; i<result.length; i++) {
      if (result[i] instanceof Date)
        result[i] = result[i].toISOString();
    }
    return result;
  }
  
  translateResult = (result: any): any => {
    if (!result) throw new Error("Missing result");
    return result.map(row => postgresRowToMongo<any>(this, row));
  }
  
  getTable = () => {
    if (bundleIsServer) { 
      if (!this.table)
        this.table = db.collection(this.tableName);
      return this.table;
    } else {
      throw new Error("Attempted to run mongodb query on the client");
    }
  }
  
  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>): FindResult<T> => {
    return {
      fetch: async () => {
        return await wrapQuery(`${this.tableName}.find(${JSON.stringify(selector)}).fetch`, async () => {
          const {sql: queryFragment, arg: queryArgs} = mongoSelectorToSql(this, selector);
          const {sql: optionsFragment, arg: optionsArgs} = mongoFindOptionsToSql(this, options);
          const result = await this.runQuery(`select * from ${this.tableName} where ${queryFragment} ${optionsFragment}`, [...queryArgs, ...optionsArgs]);
          return this.translateResult(result);
        });
      },
      count: async () => {
        const table = this.getTable();
        return await wrapQuery(`${this.tableName}.find(${JSON.stringify(selector)}).count`, async () => {
          const {sql: queryFragment, arg: queryArgs} = mongoSelectorToSql(this, selector);
          const {sql: optionsFragment, arg: optionsArgs} = mongoFindOptionsToSql(this, options);
          const result = await this.runQuery(`select count(*) from ${this.tableName} where ${queryFragment} ${optionsFragment}`, [...queryArgs, ...optionsArgs]);
          return result[0].count;
        });
      }
    };
  }
  
  findOne = async (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): Promise<T|null> => {
    const table = this.getTable();
    return await wrapQuery(`${this.tableName}.findOne(${JSON.stringify(selector)})`, async () => {
      if (typeof selector === "string") {
        const result = this.translateResult(
          await this.runQuery(`select * from ${this.tableName} where id=$1 limit 1`, [selector])
        );
        if (!result.length) return null;
        return result[0];
      } else {
        const {sql: queryFragment, arg: queryArgs} = mongoSelectorToSql(this, selector);
        const {sql: optionsFragment, arg: optionArgs} = mongoFindOptionsToSql({
          ...options,
          limit: 1,
        });
        const rawResult = await this.runQuery(
          `select * from ${this.tableName} where ${queryFragment} ${optionsFragment}`,
          [...queryArgs, ...optionArgs]
        )
        const result = this.translateResult(rawResult);
        if (!result.length) return null;
        return result[0];
      }
    });
  }
  
  insert = async (doc, options): Promise<string> => {
    if (disableAllWrites) return "";
    if (!doc._id) {
      doc._id = randomId();
    }
    const table = this.getTable();
    
    const docMinusId = {...doc};
    delete docMinusId._id;
    
    return await wrapQuery(`${this.tableName}.insert`, async () => {
      const rawResult = await this.runQuery(`insert into ${this.tableName}(id,json) values ($1,$2)`, [doc._id, docMinusId]);
      // TODO: Error handling
      return doc._id;
    });
  }
  update = async (selector, update, options) => {
    if (disableAllWrites) return;
    try {
      const table = this.getTable();
      return await wrapQuery(`${this.tableName}.update`, async () => {
        if (typeof selector === 'string') {
          const {sql: modifierSql, arg: modifierArgs} = mongoModifierToSql(this, update);
          const rawResult = await this.runQuery(
            `update ${this.tableName}
             set ${modifierSql}
             where id=$${modifierArgs.length+1}
            `, [...modifierArgs, selector]
          );
          
          //const updateResult = await table.update({_id: selector}, update, options);
          //return updateResult.matchedCount;
        } else {
          const {sql: modifierSql, arg: modifierArgs} = mongoModifierToSql(this, update);
          const {sql: selectorSql, arg: selectorArgs} = mongoSelectorToSql(this, selector, modifierArgs.length+1);
          const rawResult = await this.runQuery(
            `update ${this.tableName}
             set ${modifierSql}
             where ${selectorSql}
            `, [...modifierArgs, ...selectorArgs]
          );
          //const updateResult = await table.update(removeUndefinedFields(selector), update, options);
          //return updateResult.matchedCount;
        }
      });
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
      // eslint-disable-next-line no-console
      throw e;
    }
  }
  remove = async (selector, options) => {
    if (disableAllWrites) return;
    const table = this.getTable();
    return await wrapQuery(`${this.tableName}.remove`, async () => {
      return await table.remove(removeUndefinedFields(selector), options);
    });
  }
  _ensureIndex = async (fieldOrSpec, options)=>{
    if (disableAllWrites) return;
    const table = this.getTable();
    try {
      return await table.ensureIndex(fieldOrSpec, options);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(`Error creating index ${JSON.stringify(fieldOrSpec)} on ${this.tableName}: ${e}`);
    }
  }
  
  _ensurePgIndex = async (indexName: string, indexDescription: string) => {
    try {
      await this.runQuery(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.tableName} ${indexDescription}`, []);
      // TODO
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(`Error creating index ${indexName} on ${this.tableName}: ${e}`);
    }
  }
  
  
  //TODO
  views: any
  defaultView: any
  addView: any
  addDefaultView: any
  
  aggregate = (pipeline, options) => {
    const table = this.getTable();
    return table.aggregate(pipeline, options);
  }
  rawCollection = () => ({
    bulkWrite: async (operations, options) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return await table.bulkWrite(operations, options);
    },
    findOneAndUpdate: async (filter, update, options) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return await table.findOneAndUpdate(filter, update, options);
    },
    dropIndex: async (indexName, options) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      await table.dropIndex(indexName, options);
    },
    indexes: async (options) => {
      const table = this.getTable();
      return await table.indexes(options);
    },
    update: async (selector, update, options) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return await table.update(selector, update, options);
    },
  })
}
