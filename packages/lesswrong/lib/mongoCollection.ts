import { randomId } from './random';

let client: any = null;
let db: any = null;
export const setDatabaseConnection = (_client, _db) => {
  client = _client;
  db = _db;
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

export class MongoCollection<T extends DbObject> {
  tableName: string
  table: any
  
  constructor(tableName: string, options?: {
    _suppressSameNameError?: boolean // Used only by Meteor; disables warning about name conflict over users collection
  }) {
    this.tableName = tableName;
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
  
  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const table = this.getTable();
        return await wrapQuery(`${this.tableName}.find(${JSON.stringify(selector)}).fetch`, async () => {
          return await table.find(removeUndefinedFields(selector), {
            ...options,
          }).toArray()
        });
      },
      count: async () => {
        const table = this.getTable();
        return await wrapQuery(`${this.tableName}.find(${JSON.stringify(selector)}).count`, async () => {
          return await table.countDocuments(removeUndefinedFields(selector), {
            ...options,
          });
        });
      }
    };
  }
  findOne = async (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): Promise<T|null> => {
    const table = this.getTable();
    return await wrapQuery(`${this.tableName}.findOne(${JSON.stringify(selector)})`, async () => {
      if (typeof selector === "string") {
        return await table.findOne({_id: selector}, {
          ...options,
        });
      } else if (selector) {
        return await table.findOne(removeUndefinedFields(selector), {
          ...options,
        });
      } else {
        return null;
      }
    });
  }
  findOneArbitrary = async (): Promise<T|null> => {
    const table = this.getTable();
    return await wrapQuery(`${this.tableName}.findOneArbitrary()`, async () => {
      return await table.findOne({});
    });
  }
  rawInsert = async (doc, options) => {
    if (disableAllWrites) return;
    if (!doc._id) {
      doc._id = randomId();
    }
    const table = this.getTable();
    return await wrapQuery(`${this.tableName}.insert`, async () => {
      const insertResult = await table.insertOne(doc, options);
      return insertResult.insertedId;
    });
  }
  rawUpdateOne = async (selector, update, options) => {
    if (disableAllWrites) return;
    try {
      const table = this.getTable();
      return await wrapQuery(`${this.tableName}.updateOne`, async () => {
        if (typeof selector === 'string') {
          const updateResult = await table.updateOne({_id: selector}, update, options);
          return updateResult.matchedCount;
        } else {
          const updateResult = await table.updateOne(removeUndefinedFields(selector), update, options);
          return updateResult.matchedCount;
        }
      });
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
      // eslint-disable-next-line no-console
      console.log(`Selector was: ${selector}`);
      throw e;
    }
  }
  rawUpdateMany = async (selector, update, options) => {
    if (disableAllWrites) return;
    try {
      const table = this.getTable();
      return await wrapQuery(`${this.tableName}.updateMany`, async () => {
        if (typeof selector === 'string') {
          const updateResult = await table.updateMany({_id: selector}, update, options);
          return updateResult.matchedCount;
        } else {
          const updateResult = await table.updateMany(removeUndefinedFields(selector), update, options);
          return updateResult.matchedCount;
        }
      });
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
      // eslint-disable-next-line no-console
      console.log(`Selector was: ${selector}`);
      throw e;
    }
  }
  rawRemove = async (selector, options) => {
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
  
  
  //TODO
  views: any
  defaultView: any
  addView: any
  addDefaultView: any
  
  aggregate = (pipeline, options) => {
    const table = this.getTable();
    return {
      toArray: async () => {
        return await wrapQuery(`${this.tableName}.aggregate(...).toArray`, () => {
          return table.aggregate(pipeline, options).toArray();
        });
      }
    };
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
    updateOne: async (selector, update, options) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return await table.updateOne(selector, update, options);
    },
    updateMany: async (selector, update, options) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return await table.updateMany(selector, update, options);
    },
  })
}
