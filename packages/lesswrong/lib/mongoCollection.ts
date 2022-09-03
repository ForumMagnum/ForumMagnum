import merge from 'lodash/merge';
import type { Collection, Db, CreateIndexesOptions, MongoClient, FindOptions, InsertOneOptions, UpdateFilter, UpdateOptions, Filter, DeleteOptions, IndexSpecification, Document, IndexInformationOptions, DropIndexesOptions, FindOneAndUpdateOptions, AnyBulkWriteOperation, BulkWriteOptions, AggregateOptions, OptionalUnlessRequiredId, WithId } from 'mongodb';
import _ from 'underscore';
import { DatabasePublicSetting } from './publicSettings';
import { randomId } from './random';
import { loggerConstructor } from './utils/logging';
import { camelCaseify, pluralize, viewFieldAllowAny, viewFieldNullOrMissing } from './vulcan-lib';

const maxDocumentsPerRequestSetting = new DatabasePublicSetting<number>('maxDocumentsPerRequest', 5000)

let client: MongoClient | null = null;
let db: Db | null = null;
export const setDatabaseConnection = (_client: MongoClient, _db: Db) => {
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

async function wrapQuery<T>(description: string, queryFn: () => Promise<T>) {
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
  table: Collection<T>
  
  constructor(tableName: string, options?: {
    _suppressSameNameError?: boolean // Used only by Meteor; disables warning about name conflict over users collection
  }) {
    this.tableName = tableName;
  }
  
  getTable = () => {
    if (bundleIsServer) { 
      if (!db) {
        throw new Error("DB connection has not been initialized");
      }
      if (!this.table)
        this.table = db.collection(this.tableName);
      return this.table;
    } else {
      throw new Error("Attempted to run mongodb query on the client");
    }
  }
  
  find = (selector?: Filter<T>, options?: FindOptions) => {
    return {
      fetch: async (): Promise<T[]> => {
        const table = this.getTable();
        return wrapQuery(`${this.tableName}.find(${JSON.stringify(selector)}).fetch`, async () => {
          return table.find(removeUndefinedFields(selector), {
            ...options,
          }).toArray() as Promise<T[]>
        });
      },
      count: async () => {
        const table = this.getTable();
        return wrapQuery(`${this.tableName}.find(${JSON.stringify(selector)}).count`, async () => {
          return table.countDocuments(removeUndefinedFields(selector), {
            ...options,
          });
        });
      }
    };
  }
  findOne = async (selector?: string | Filter<T> | null, options?: FindOptions, projection?: MongoProjection<T>): Promise<T|null> => {
    const table = this.getTable();
    return wrapQuery(`${this.tableName}.findOne(${JSON.stringify(selector)})`, async () => {
      if (typeof selector === "string") {
        const filterQuery = {_id: selector} as Filter<T>;
        return table.findOne(filterQuery, {
          ...options,
        }) as Promise<T | null>;
      } else if (selector) {
        return table.findOne(removeUndefinedFields(selector), {
          ...options,
        }) as Promise<T | null>;
      } else {
        return null;
      }
    });
  }
  findOneArbitrary = async (): Promise<T | null> => {
    const table = this.getTable();
    return wrapQuery(`${this.tableName}.findOneArbitrary()`, async () => {
      return table.findOne({}) as Promise<T | null>;
    });
  }
  rawInsert = async (doc: OptionalUnlessRequiredId<T>, options: InsertOneOptions) => {
    if (disableAllWrites) return '';
    if (!doc._id) {
      doc._id = randomId();
    }
    const table = this.getTable();
    return wrapQuery(`${this.tableName}.insert`, async () => {
      const insertResult = await table.insertOne(doc, options);
      return insertResult.insertedId;
    });
  }
  rawUpdateOne = async (selector: string | Filter<T>, update: UpdateFilter<T>, options: UpdateOptions = {}) => {
    if (disableAllWrites) return 0;
    try {
      const table = this.getTable();
      return wrapQuery(`${this.tableName}.updateOne`, async () => {
        if (typeof selector === 'string') {
          const filter = {_id: selector} as Filter<T>;
          const updateResult = await table.updateOne(filter, update, options);
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
  rawUpdateMany = async (selector: string | Filter<T>, update: UpdateFilter<T>, options: UpdateOptions = {}) => {
    if (disableAllWrites) return;
    try {
      const table = this.getTable();
      return wrapQuery(`${this.tableName}.updateMany`, async () => {
        if (typeof selector === 'string') {
          const filter = {_id: selector} as Filter<T>;
          const updateResult = await table.updateMany(filter, update, options);
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
  rawRemove = async (selector: Filter<T>, options: DeleteOptions) => {
    if (disableAllWrites) return;
    const table = this.getTable();
    return wrapQuery(`${this.tableName}.remove`, async () => {
      // Deprecated somewhere from 3.6.5 to 4.9.1.  JSDoc says the callback is options, though the type signature doesn't.
      // @ts-ignore
      return table.remove(removeUndefinedFields(selector), options);
    });
  }
  _ensureIndex = async (fieldOrSpec: IndexSpecification, options: CreateIndexesOptions)=>{
    if (disableAllWrites) return;
    const table = this.getTable();
    try {
      // const indexExists = await table.in(fieldOrSpec);
      return table.createIndex(fieldOrSpec, options);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(`Error creating index ${JSON.stringify(fieldOrSpec)} on ${this.tableName}: ${e}`);
    }
  }
  
  
  //TODO
  // views: any
  // defaultView: any
  // addView: any
  
  
  aggregate = <O extends Record<string, any>>(pipeline: Document[], options?: AggregateOptions) => {
    const table = this.getTable();
    return {
      toArray: async () => {
        return wrapQuery(`${this.tableName}.aggregate(...).toArray`, () => {
          return table.aggregate<O>(pipeline, options).toArray();
        });
      }
    };
  }
  rawCollection = () => ({
    bulkWrite: async (operations: AnyBulkWriteOperation<T>[], options: BulkWriteOptions) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return table.bulkWrite(operations, options);
    },
    findOneAndUpdate: async (filter: Filter<T>, update: UpdateFilter<T>, options: FindOneAndUpdateOptions) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return table.findOneAndUpdate(filter, update, options);
    },
    dropIndex: async (indexName: string, options: DropIndexesOptions) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      await table.dropIndex(indexName, options);
    },
    indexes: async (options: IndexInformationOptions) => {
      const table = this.getTable();
      return table.indexes(options);
    },
    updateOne: async (selector: Filter<T>, update: Partial<T> | UpdateFilter<T>, options: UpdateOptions) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return table.updateOne(selector, update, options);
    },
    updateMany: async (selector: Filter<T>, update: UpdateFilter<T>, options: UpdateOptions) => {
      if (disableAllWrites) return;
      const table = this.getTable();
      return table.updateMany(selector, update, options);
    },
  })
}


// export interface CollectionBaseOptions<
//   N extends CollectionNameString,
//   T extends DbObject=ObjectsByCollectionName[N]
// > {
//   typeName: string;
//   collectionName: N;
//   schema: SchemaType<T>,
//   generateGraphQLSchema?: boolean,
//   dbCollectionName?: string,
//   collection?: any,
//   resolvers?: any,
//   mutations?: any,
//   logChanges?: boolean,
//   // interfaces?: Array<string>
//   // description?: string
// }


export interface CollectionBaseOptions<
  N extends CollectionNameString,
  T extends DbObject=ObjectsByCollectionName[N]
> {
  typeName: string,
  collectionName: N,
  schema: SchemaType<T>,
  generateGraphQLSchema?: boolean,
  dbCollectionName?: string,
  collection?: any,
  resolvers?: any,
  mutations?: any,
  logChanges?: boolean,
}


export class CollectionB<
  T extends DbObject,
  N extends CollectionNameString = CollectionNameString
> extends MongoCollection<T> implements CollectionBase<T, N> {
  options: CollectionOptions<N>;
  typeName: string;
  collectionName: N;
  _schemaFields: SchemaType<T>;
  _simpleSchema: any; // TODO
  defaultView: ViewFunction<N>;
  views: Record<string, ViewFunction<N>>;

  checkAccess: (user: DbUser|null, obj: T, context: ResolverContext|null, outReasonDenied?: {reason?: string}) => Promise<boolean>;

  constructor(tableName: string, collectionBaseOptions: CollectionBaseOptions<N, T>) {
    super(tableName);
    const {
      typeName,
      schema,
      collectionName
    } = collectionBaseOptions;

    this.collectionName = collectionName;

    const hydratedBaseOptions: CollectionOptions<N> = {
      ...collectionBaseOptions,
      singleResolverName: camelCaseify(typeName),
      multiResolverName: camelCaseify(pluralize(typeName)),
    }

    this.options = hydratedBaseOptions;

    // add typeName if missing
    this.typeName = typeName;

    // add views
    this.views = {};
  
    // Schema fields, passed as the schema option to createCollection or added
    // later with addFieldsDict. Do not access directly; use getSchema.
    this._schemaFields = schema;
    // Schema fields, but converted into the format used by the simple-schema
    // library. This is a cache of the conversion; when _schemaFields changes it
    // should be invalidated by setting it to null. Do not access directly; use
    // getSimpleSchema.
    this._simpleSchema = null;
  }

  addDefaultView(view: ViewFunction<N>) {
    this.defaultView = view;
  }

  addView(viewName: string, view: ViewFunction<N>) {
    this.views[viewName] = view;
  }

  getParameters(terms: ViewTermsByCollectionName[N] = {}, apolloClient?: any, context?: ResolverContext): MergedViewQueryAndOptions<N,T> {
    const logger = loggerConstructor(`views-${this.tableName.toLowerCase()}`)
    logger('getParameters(), terms:', terms);

    let parameters: any = {
      selector: {},
      options: {},
    };

    if (this.defaultView) {
      parameters = merge(
        parameters,
        this.defaultView(terms, apolloClient, context)
      );
      logger('getParameters(), parameters after defaultView:', parameters)
    }

    // handle view option
    if (terms.view && this.views[terms.view]) {
      const viewFn = this.views[terms.view];
      const view = viewFn(terms, apolloClient, context);
      let mergedParameters = merge(parameters, view);

      if (
        mergedParameters.options &&
        mergedParameters.options.sort &&
        view.options &&
        view.options.sort
      ) {
        // If both the default view and the selected view have sort options,
        // don't merge them together; take the selected view's sort. (Otherwise
        // they merge in the wrong order, so that the default-view's sort takes
        // precedence over the selected view's sort.)
        mergedParameters.options.sort = view.options.sort;
      }
      parameters = mergedParameters;
      logger('getParameters(), parameters after defaultView and view:', parameters)
    }

    // sort using terms.orderBy (overwrite defaultView's sort)
    if (terms.orderBy && !_.isEmpty(terms.orderBy)) {
      parameters.options.sort = terms.orderBy;
    }

    // if there is no sort, default to sorting by createdAt descending
    if (!parameters.options.sort) {
      parameters.options.sort = { createdAt: -1 } as any;
    }

    // extend sort to sort posts by _id to break ties, unless there's already an id sort
    // NOTE: always do this last to avoid overriding another sort
    if (!(parameters.options.sort && typeof parameters.options.sort._id !== undefined)) {
      parameters = merge(parameters, { options: { sort: { _id: -1 } } });
    }

    // remove any null fields (setting a field to null means it should be deleted)
    Object.keys(parameters.selector).forEach(key => {
      if (_.isEqual(parameters.selector[key], viewFieldNullOrMissing)) {
        parameters.selector[key] = null;
      } else if (_.isEqual(parameters.selector[key], viewFieldAllowAny)) {
        delete parameters.selector[key];
      } else if (parameters.selector[key] === null || parameters.selector[key] === undefined) {
        //console.log(`Warning: Null key ${key} in query of collection ${collectionName} with view ${terms.view}.`);
        delete parameters.selector[key];
      }
    });
    if (parameters.options.sort) {
      Object.keys(parameters.options.sort).forEach(key => {
        if (parameters.options.sort[key] === null) {
          delete parameters.options.sort[key];
        }
      });
    }

    // limit number of items to 1000 by default
    const maxDocuments = maxDocumentsPerRequestSetting.get();
    const limit = terms.limit || parameters.options.limit;
    parameters.options.limit = !limit || limit < 1 || limit > maxDocuments ? maxDocuments : limit;

    logger('getParameters(), final parameters:', parameters);
    return parameters;
  }
}