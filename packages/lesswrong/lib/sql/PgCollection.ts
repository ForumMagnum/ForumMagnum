import { MongoCollection, getSqlClient } from "../mongoCollection";
import Table from "./Table";
import Query from "./Query";
import InsertQuery from "./InsertQuery";
import SelectQuery from "./SelectQuery";
import UpdateQuery from "./UpdateQuery";
import DeleteQuery from "./DeleteQuery";
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

  private getSqlClient() {
    const sql = getSqlClient();
    if (!sql) {
      throw new Error("SQL client is not initialized");
    }
    return sql;
  }

  /**
   * Execute the given query
   * The `selector` parameter is completely optional and is only used to improve
   * the error message if something goes wrong
   */
  async executeQuery<R extends {} = T>(query: Query<T>, selector?: any): Promise<RowList<TransformRow<R>[]>> {
    const {sql, args} = query.compile();
    try {
      // `return await` looks weird, but it's necessary for the correct semantics
      // as the client doesn't begin executing the query until it's awaited
      return await this.getSqlClient().unsafe<R[]>(sql, args);
    } catch (error) {
      console.error(`SQL Error: ${error.message}: \`${sql}\`: ${util.inspect(args)}: ${util.inspect(selector, {depth: null})}`);
      throw error;
    }
  }

  getTable = () => this.table;

  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const select = new SelectQuery<T>(this.table, selector, options);
        const result = await this.executeQuery(select, selector);
        return result as unknown as T[];
      },
      count: async () => {
        const select = new SelectQuery(this.table, selector, options, {count: true});
        const result = await this.executeQuery<{count: number}>(select, selector);
        return result?.[0].count ?? 0;
      },
    };
  }

  findOne = async (
    selector?: string | MongoSelector<T>,
    options?: MongoFindOneOptions<T>,
    projection?: MongoProjection<T>,
  ): Promise<T|null> => {
    const select = new SelectQuery<T>(this.table, selector, {limit: 1, ...options, projection});
    const result = await this.executeQuery(select, selector);
    return result ? result[0] as unknown as T : null;
  }

  findOneArbitrary = async (): Promise<T|null> => {
    const select = new SelectQuery<T>(this.table, undefined, {limit: 1});
    const result = await this.executeQuery(select);
    return result ? result[0] as unknown as T : null;
  }

  rawInsert = async (data: T, options: MongoInsertOptions<T>) => {
    const insert = new InsertQuery<T>(this.table, data, options);
    await this.executeQuery(insert, data);
  }

  rawUpdateOne = async (
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T>,
  ) => {
    const update = new UpdateQuery<T>(this.table, selector, modifier, options, 1);
    const result = await this.executeQuery(update, {selector, modifier});
    return result.count;
  }

  rawUpdateMany = async (
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T>,
  ) => {
    const update = new UpdateQuery<T>(this.table, selector, modifier, options);
    const result = await this.executeQuery(update, {selector, modifier});
    return result.count;
  }

  rawRemove = async (selector: string | MongoSelector<T>, options?: MongoRemoveOptions<T>) => {
    const query = new DeleteQuery<T>(this.table, selector, options);
    const result = await this.executeQuery(query, selector);
    return {deletedCount: result.count};
  }

  // TODO: What are the options?
  _ensureIndex = async (fieldOrSpec: string | Record<string, any>, options_: any) => {
    const index = typeof fieldOrSpec === "string" ? [fieldOrSpec] : Object.keys(fieldOrSpec);
    if (!this.table.hasIndex(index)) {
      this.table.addIndex(index);
      const sql = this.getSqlClient();
      const query = this.table.buildCreateIndexSQL(sql, index);
      await query;
    }
  }

  aggregate = (pipeline: MongoAggregationPipeline<T>, options?: MongoAggregationOptions) => {
    return {
      toArray: async () => {
        try {
          const query = new Pipeline<T>(this.table, pipeline, options).toQuery();
          const result = await this.executeQuery<T>(query);
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
    findOneAndUpdate: async (filter, update, options) => {
      throw new Error("TODO: PgCollection: rawCollection.findOneAndUpdate not yet implemented");
    },
    dropIndex: async (indexName, options) => {
      throw new Error("TODO: PgCollection: rawCollection.dropIndex not yet implemented");
    },
    indexes: async (options) => {
      throw new Error("TODO: PgCollection: rawCollection.indexes not yet implemented");
    },
    updateOne: async (selector, update, options) => {
      throw new Error("TODO: PgCollection: rawCollection.updateOne not yet implemented");
    },
    updateMany: async (selector, update, options) => {
      throw new Error("TODO: PgCollection: rawCollection.updateMany not yet implemented");
    },
  });
}

export default PgCollection;
