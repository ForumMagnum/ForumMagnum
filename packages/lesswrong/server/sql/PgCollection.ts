import { getSqlClient, getSqlClientOrThrow } from "../sql/sqlClient";
import Table from "./Table";
import Query from "./Query";
import InsertQuery from "./InsertQuery";
import SelectQuery from "./SelectQuery";
import UpdateQuery from "./UpdateQuery";
import DeleteQuery from "./DeleteQuery";
import CreateIndexQuery from "./CreateIndexQuery";
import DropIndexQuery from "./DropIndexQuery";
import Pipeline from "./Pipeline";
import BulkWriter, { BulkWriterResult } from "./BulkWriter";
import util from "util";

let executingQueries = 0;

export const isAnyQueryPending = () => executingQueries > 0;

export type DbTarget = "read" | "write" | "noTransaction";

type ExecuteQueryData<T extends DbObject> = {
  selector: MongoSelector<T> | string;
  projection: MongoProjection<T>;
  data: T;
  modifier: MongoModifier<T>;
  fieldOrSpec: MongoIndexFieldOrKey<T>;
  pipeline: MongoAggregationPipeline<T>;
  operations: MongoBulkWriteOperations<T>;
  indexName: string;
  options: MongoFindOptions<T>
    | MongoUpdateOptions<T>
    | MongoUpdateOptions<T>
    | MongoRemoveOptions<T>
    | MongoEnsureIndexOptions<T>
    | MongoAggregationOptions
    | MongoBulkWriteOptions
    | MongoDropIndexOptions;
}

/**
 * PgCollection is the main external interface for other parts of the codebase to
 * access data inside of Postgres.
 */
class PgCollection<
  N extends CollectionNameString = CollectionNameString
> implements CollectionBase<N> {
  collectionName: N;
  tableName: string;
  defaultView: ViewFunction<N> | undefined;
  views: Record<string, ViewFunction<N>> = {};
  postProcess?: (data: ObjectsByCollectionName[N]) => ObjectsByCollectionName[N];
  typeName: string;
  options: CollectionOptions<N>;
  _schemaFields: SchemaType<N>;
  _simpleSchema: any;
  checkAccess: CheckAccessFunction<ObjectsByCollectionName[N]>;
  private table: Table<ObjectsByCollectionName[N]>;
  private voteable = false;

  constructor(options: CollectionOptions<N>) {
    this.collectionName = options.collectionName;
    this.typeName = options.typeName;
    this.tableName = options.dbCollectionName ?? options.collectionName.toLowerCase();
    this.options = options;

    // Schema fields, passed as the schema option to createCollection or added
    // later with addFieldsDict. Do not access directly; use getSchema.
    this._schemaFields = options.schema;
    // Schema fields, but converted into the format used by the simple-schema
    // library. This is a cache of the conversion; when _schemaFields changes it
    // should be invalidated by setting it to null. Do not access directly; use
    // getSimpleSchema.
    this._simpleSchema = null;
  }

  isConnected() {
    return !!getSqlClient();
  }

  isVoteable(): this is CollectionBase<VoteableCollectionName> & PgCollection<VoteableCollectionName> {
    return this.voteable;
  }

  makeVoteable() {
    this.voteable = true;
  }

  hasSlug(): this is PgCollection<CollectionNameWithSlug> {
    return !!this._schemaFields.slug;
  }

  getTable() {
    return this.table;
  }

  buildPostgresTable() {
    this.table = Table.fromCollection<N>(this);
  }

  /**
   * Execute the given query
   * The `data` parameter is completely optional and is only used to improve
   * the error message if something goes wrong. It can also be used to disable
   * logging by setting `data.options.quiet` to `true`.
   */
  async executeQuery(
    query: Query<ObjectsByCollectionName[N]>,
    data?: Partial<ExecuteQueryData<ObjectsByCollectionName[N]>>,
    target: DbTarget = "write"
  ): Promise<any[]> {
    executingQueries++;
    let result: any[];
    const quiet = data?.options?.quiet ?? false;
    try {
      const {sql, args} = query.compile();
      const client = getSqlClientOrThrow(target);

      result = await client.any(sql, args, () => `${sql}: ${JSON.stringify(args)}`, quiet);

    } catch (error) {
      // If this error gets triggered, you probably generated a malformed query
      const {collectionName} = this;
      const stringified = util.inspect({collectionName, ...data}, {depth: null});
      const {sql, args} = query.compile();
      if (!quiet) {
        // eslint-disable-next-line no-console
        console.error(`SQL Error for ${collectionName} at position ${error.position}: ${error.message}: \`${sql}\`: ${util.inspect(args)}: ${stringified}`);
      }
      throw error;
    } finally {
      executingQueries--;
    }
    const {postProcess} = this;
    return postProcess
      ? result.map((data) => postProcess(data))
      : result;
  }

  async executeReadQuery(
    query: Query<ObjectsByCollectionName[N]>,
    data?: Partial<ExecuteQueryData<ObjectsByCollectionName[N]>>,
  ): Promise<any[]> {
    return this.executeQuery(query, data, "read");
  }

  async executeWriteQuery(
    query: Query<ObjectsByCollectionName[N]>,
    data?: Partial<ExecuteQueryData<ObjectsByCollectionName[N]>>,
  ): Promise<any[]> {
    return this.executeQuery(query, data, "write");
  }

  find: FindFn<ObjectsByCollectionName[N]> = (selector, options, projection) => {
    return {
      fetch: async () => {
        const select = new SelectQuery<ObjectsByCollectionName[N]>(this.getTable(), selector, { ...options, projection });
        const result = await this.executeReadQuery(select, {selector, options, projection});
        return result;
      },
      count: async () => {
        const select = new SelectQuery(this.getTable(), selector, { ...options, projection }, {count: true});
        const result = await this.executeReadQuery(select, {selector, options, projection});
        return parseInt(result?.[0].count ?? 0);
      },
    };
  }

  findOne: FindOneFn<ObjectsByCollectionName[N]> = async (selector, options, projection) => {
    const select = new SelectQuery<ObjectsByCollectionName[N]>(this.getTable(), selector, {limit: 1, ...options, projection});
    const result = await this.executeReadQuery(select, {selector, options, projection});
    return result ? result[0] : null;
  }

  async findOneArbitrary(): Promise<ObjectsByCollectionName[N]|null> {
    const select = new SelectQuery<ObjectsByCollectionName[N]>(this.getTable(), undefined, {limit: 1});
    const result = await this.executeReadQuery(select, undefined);
    return result ? result[0] : null;
  }

  async rawInsert(
    data: ObjectsByCollectionName[N],
    options: MongoInsertOptions<ObjectsByCollectionName[N]>,
  ) {
    const insert = new InsertQuery<ObjectsByCollectionName[N]>(this.getTable(), data, options, {returnInserted: true});
    const result = await this.executeWriteQuery(insert, {data, options});
    return result[0]._id;
  }

  private async upsert(
    selector: string | MongoSelector<ObjectsByCollectionName[N]>,
    modifier: MongoModifier<ObjectsByCollectionName[N]>,
    options: MongoUpdateOptions<ObjectsByCollectionName[N]> & {upsert: true},
  ) {
    const {$set, ...rest} = modifier;
    const data = {
      ...$set,
      ...rest,
      ...selector,
    };
    const upsert = new InsertQuery<ObjectsByCollectionName[N]>(this.getTable(), data, options, {
      conflictStrategy: "upsert",
      upsertSelector: selector,
    });
    const result = await this.executeWriteQuery(upsert, {selector, modifier, options});
    const action = result[0]?.action;
    if (!action) {
      return 0;
    }
    const returnCount = options?.returnCount ?? "matchedCount";
    switch (returnCount) {
    case "matchedCount":
      return action === "updated" ? 1 : 0;
    case "upsertedCount":
      return action === "inserted" ? 1 : 0;
    default:
      throw new Error(`Invalid upsert return count: ${returnCount}`);
    }
  }

  async rawUpdateOne(
    selector: string | MongoSelector<ObjectsByCollectionName[N]>,
    modifier: MongoModifier<ObjectsByCollectionName[N]>,
    options: MongoUpdateOptions<ObjectsByCollectionName[N]>,
  ) {
    if (options?.upsert) {
      return this.upsert(selector, modifier, options);
    }
    const update = new UpdateQuery<ObjectsByCollectionName[N]>(this.getTable(), selector, modifier, options, {limit: 1});
    const result = await this.executeWriteQuery(update, {selector, modifier, options});
    return result.length;
  }

  async rawUpdateMany(
    selector: string | MongoSelector<ObjectsByCollectionName[N]>,
    modifier: MongoModifier<ObjectsByCollectionName[N]>,
    options?: MongoUpdateOptions<ObjectsByCollectionName[N]>,
  ) {
    const update = new UpdateQuery<ObjectsByCollectionName[N]>(this.getTable(), selector, modifier, options);
    const result = await this.executeWriteQuery(update, {selector, modifier, options});
    return result.length;
  }

  async rawRemove(
    selector: string | MongoSelector<ObjectsByCollectionName[N]>,
    options?: MongoRemoveOptions<ObjectsByCollectionName[N]>,
  ) {
    options = Object.assign({noSafetyHarness: true}, options);
    const query = new DeleteQuery<ObjectsByCollectionName[N]>(this.getTable(), selector, options, options);
    const result = await this.executeWriteQuery(query, {selector, options});
    return {deletedCount: result.length};
  }

  async _ensureIndex(
    fieldOrSpec: MongoIndexFieldOrKey<ObjectsByCollectionName[N]>,
    options?: MongoEnsureIndexOptions<ObjectsByCollectionName[N]>,
  ) {
    if (!this.table) {
      throw new Error("Postgres tables must be initialized before calling ensureIndex");
    }
    const key: MongoIndexKeyObj<ObjectsByCollectionName[N]> = typeof fieldOrSpec === "string"
      ? {[fieldOrSpec as keyof ObjectsByCollectionName[N]]: 1 as const} as MongoIndexKeyObj<ObjectsByCollectionName[N]>
      : fieldOrSpec;
    const index = this.table.getIndex(Object.keys(key), options) ?? this.getTable().addIndex(key, options);
    const query = new CreateIndexQuery({ table: this.getTable(), index, ifNotExists: true });

    if (!options?.concurrently) {
      await this.executeQuery(query, {fieldOrSpec, options}, "write")
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `Running CREATE INDEX CONCURRENTLY query without waiting for it to complete, ` +
        `as this would cause a deadlock. If your code relies on this index existing immediately ` +
        `you should deploy in two stages. This is the query in question: "${query.compile()?.sql}"`
      )
      void this.executeQuery(query, {fieldOrSpec, options}, "noTransaction")
    }
  }

  aggregate = (
    pipeline: MongoAggregationPipeline<ObjectsByCollectionName[N]>,
    options?: MongoAggregationOptions,
    comment?: string,
  ) => {
    return {
      toArray: async () => {
        try {
          const query = new Pipeline(this.getTable(), pipeline, options, comment).toQuery();
          const result = await this.executeReadQuery(query, {pipeline, options});
          return result;
        } catch (e) {
          const {collectionName} = this;
          // If you see this, you probably built a bad aggregation pipeline, or
          // this file has a bug, or you're using an unsupported aggregation
          // pipeline operator
          // eslint-disable-next-line no-console
          console.error("Aggregate error:", collectionName, ":", e, ":", util.inspect(pipeline, {depth: null}));
          throw e;
        }
      },
    };
  }

  rawCollection = () => ({
    bulkWrite: async (
      operations: MongoBulkWriteOperations<ObjectsByCollectionName[N]>,
      options?: MongoBulkWriteOptions,
    ) => {
      executingQueries++;
      let result: BulkWriterResult;
      try {
        const client = getSqlClientOrThrow();
        const writer = new BulkWriter(this.getTable(), operations, options);
        result = await writer.execute(client);
      } finally {
        executingQueries--;
      }
      return result;
    },
    findOneAndUpdate: async (
      selector: string | MongoSelector<ObjectsByCollectionName[N]>,
      modifier: MongoModifier<ObjectsByCollectionName[N]>,
      options: MongoUpdateOptions<ObjectsByCollectionName[N]>,
    ) => {
      const update = new UpdateQuery<ObjectsByCollectionName[N]>(this.getTable(), selector, modifier, options, {limit: 1, returnUpdated: true});
      const result = await this.executeWriteQuery(update, {selector, modifier, options});
      return {
        ok: 1,
        value: result[0],
      };
    },
    dropIndex: async (indexName: string, options?: MongoDropIndexOptions) => {
      const dropIndex = new DropIndexQuery(this.getTable(), indexName);
      await this.executeWriteQuery(dropIndex, {indexName, options})
    },
    indexes: (_options: never) => {
      return Promise.resolve(this.getTable().getRequestedIndexes().map((index) => index.getDetails()));
    },
    updateOne: async (
      selector: string | MongoSelector<ObjectsByCollectionName[N]>,
      modifier: MongoModifier<ObjectsByCollectionName[N]>,
      options: MongoUpdateOptions<ObjectsByCollectionName[N]>,
    ) => {
      const result = await this.rawUpdateOne(selector, modifier, options);
      return {
        acknowledged: true,
        matchedCount: result,
        modifiedCount: result,
      };
    },
    updateMany: async (
      selector: string | MongoSelector<ObjectsByCollectionName[N]>,
      modifier: MongoModifier<ObjectsByCollectionName[N]>,
      options: MongoUpdateOptions<ObjectsByCollectionName[N]>,
    ) => {
      await this.rawUpdateMany(selector, modifier, options);
      return {
        ok: 1,
        value: null,
      };
    },
  });

  /**
   * Add a default view function.
   */
  addDefaultView(view: ViewFunction<N>) {
    this.defaultView = view;
  }

  /**
   * Add a named view function.
   */
  addView(viewName: string, view: ViewFunction<N>) {
    this.views[viewName] = view;
  }
}

export default PgCollection;
