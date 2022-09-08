import { MongoCollection, getSqlClient } from "../mongoCollection";
import Table from "./Table";
import Query from "./Query";
import InsertQuery from "./InsertQuery";
import SelectQuery from "./SelectQuery";
import UpdateQuery from "./UpdateQuery";
import DeleteQuery from "./DeleteQuery";
import CreateIndexQuery from "./CreateIndexQuery";
import DropIndexQuery from "./DropIndexQuery";
import Pipeline from "./Pipeline";
import util from "util";
import type { RowList, TransformRow } from "postgres";

class PgCollection<T extends DbObject> extends MongoCollection<T> {
  table: Table;

  constructor(tableName: string, options?: { _suppressSameNameError?: boolean }) {
    super(tableName, options);
  }

  isPostgres() {
    return true;
  }

  buildPostgresTable() {
    this.table = Table.fromCollection(this as unknown as CollectionBase<T>);
  }

  /**
   * Execute the given query
   * The `debugData` parameter is completely optional and is only used to improve
   * the error message if something goes wrong
   */
  async executeQuery<R extends {} = T>(query: Query<T>, debugData?: any): Promise<RowList<TransformRow<R>[]>> {
    const {sql, args} = query.compile();
    const client = getSqlClient();
    if (!client) {
      throw new Error("SQL client is not initialized");
    }
    try {
      // `return await` looks weird, but it's necessary for the correct semantics
      // as the client doesn't begin executing the query until it's awaited
      return await client.unsafe<R[]>(sql, args);
    } catch (error) {
      debugData = util.inspect(debugData, {depth: null});
      console.error(`SQL Error: ${error.message}: \`${sql}\`: ${util.inspect(args)}: ${debugData}`);
      throw error;
    }
  }

  getTable = () => {
    if (bundleIsServer) {
      return this.table;
    } else {
      throw new Error("Attempted to run postgres query on the client");
    }
  }

  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const select = new SelectQuery<T>(this.getTable(), selector, options);
        const result = await this.executeQuery(select, {selector, options});
        return result as unknown as T[];
      },
      count: async () => {
        const select = new SelectQuery(this.getTable(), selector, options, {count: true});
        const result = await this.executeQuery<{count: number}>(select, {selector, options});
        return result?.[0].count ?? 0;
      },
    };
  }

  findOne = async (
    selector?: string | MongoSelector<T>,
    options?: MongoFindOneOptions<T>,
    projection?: MongoProjection<T>,
  ): Promise<T|null> => {
    const select = new SelectQuery<T>(this.getTable(), selector, {limit: 1, ...options, projection});
    const result = await this.executeQuery(select, {selector, options, projection});
    return result ? result[0] as unknown as T : null;
  }

  findOneArbitrary = async (): Promise<T|null> => {
    const select = new SelectQuery<T>(this.getTable(), undefined, {limit: 1});
    const result = await this.executeQuery(select);
    return result ? result[0] as unknown as T : null;
  }

  rawInsert = async (data: T, options: MongoInsertOptions<T>) => {
    const insert = new InsertQuery<T>(this.getTable(), data, options);
    await this.executeQuery(insert, {data, options});
  }

  rawUpdateOne = async (
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T>,
  ) => {
    const update = new UpdateQuery<T>(this.getTable(), selector, modifier, options, {limit: 1});
    const result = await this.executeQuery(update, {selector, modifier, options});
    return result.count;
  }

  rawUpdateMany = async (
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T>,
  ) => {
    const update = new UpdateQuery<T>(this.getTable(), selector, modifier, options);
    const result = await this.executeQuery(update, {selector, modifier, options});
    return result.count;
  }

  rawRemove = async (selector: string | MongoSelector<T>, options?: MongoRemoveOptions<T>) => {
    const query = new DeleteQuery<T>(this.getTable(), selector, options);
    const result = await this.executeQuery(query, {selector, options});
    return {deletedCount: result.count};
  }

  _ensureIndex = async (fieldOrSpec: MongoIndexSpec, options?: MongoEnsureIndexOptions) => {
    const fields = typeof fieldOrSpec === "string" ? [fieldOrSpec] : Object.keys(fieldOrSpec);
    if (!this.getTable().hasIndex(fields, options)) {
      const index = this.getTable().addIndex(fields, options);
      const query = new CreateIndexQuery(this.getTable(), index);
      await this.executeQuery(query, {fieldOrSpec, options})
    }
  }

  aggregate = (pipeline: MongoAggregationPipeline<T>, options?: MongoAggregationOptions) => {
    return {
      toArray: async () => {
        try {
          const query = new Pipeline<T>(this.getTable(), pipeline, options).toQuery();
          const result = await this.executeQuery<T>(query, {pipeline, options});
          return result as unknown as T[];
        } catch (e) {
          console.error("Aggregate error:", e, ":", util.inspect(pipeline, {depth: null}));
          throw e;
        }
      },
    };
  }

  rawCollection = () => ({
    bulkWrite: async (operations, options) => {
      throw new Error("TODO: PgCollection: rawCollection.bulkWrite not yet implemented");
    },
    findOneAndUpdate: async (
      selector: string | MongoSelector<T>,
      modifier: MongoModifier<T>,
      options: MongoUpdateOptions<T>,
    ) => {
      const update = new UpdateQuery<T>(this.getTable(), selector, modifier, options, {limit: 1, returnUpdated: true});
      const result = await this.executeQuery(update, {selector, modifier, options});
      return {
        ok: 1,
        value: result[0],
      };
    },
    dropIndex: async (indexName: string, options?: MongoDropIndexOptions) => {
      const dropIndex = new DropIndexQuery(this.getTable(), indexName);
      await this.executeQuery(dropIndex, {indexName, options})
    },
    indexes: (_options: never) => {
      return Promise.resolve(this.getTable().getIndexes().map((index) => index.getDetails()));
    },
    updateOne: async (
      selector: string | MongoSelector<T>,
      modifier: MongoModifier<T>,
      options: MongoUpdateOptions<T>,
    ) => {
      const result = await this.rawUpdateOne(selector, modifier, options);
      return {
        acknowledged: true,
        matchedCount: result,
        modifiedCount: result,
      };
    },
    updateMany: async (
      selector: string | MongoSelector<T>,
      modifier: MongoModifier<T>,
      options: MongoUpdateOptions<T>,
    ) => {
      await this.rawUpdateMany(selector, modifier, options);
      return {
        ok: 1,
        value: null,
      };
    },
  });
}

export default PgCollection;
