import { MongoCollection, getSqlClient } from "../mongoCollection";
import Table from "./Table";
import Query from "./Query";
import Pipeline from "./Pipeline";
import util from "util";

class PgCollection<T extends DbObject> extends MongoCollection<T> {
  pgTable: Table;

  constructor(tableName: string, options?: { _suppressSameNameError?: boolean }) {
    super(tableName, options);
  }

  isPostgres() {
    return true;
  }

  buildPostgresTable() {
    this.pgTable = Table.fromCollection(this as unknown as CollectionBase<T>);
  }

  private getSqlClient() {
    const sql = getSqlClient();
    if (!sql) {
      throw new Error("SQL client is not initialized");
    }
    return sql;
  }

  private async rawExecuteQuery<R extends {} = T>(query: Query<T>, selector?: any) {
    const {sql, args} = query.compile();
    try {
      return await this.getSqlClient().unsafe(sql, args);
    } catch (error) {
      console.error(`SQL Error: ${error.message}: \`${sql}\`: ${util.inspect(args)}: ${util.inspect(selector, {depth: null})}`);
      throw error;
    }
  }

  /**
   * Execute the given query
   * The `selector` parameter is completely optional and is only used to improve
   * the error message if something goes wrong
   */
  executeQuery<R extends {} = T>(query: Query<T>, selector?: any): Promise<R[]|null> {
    return this.rawExecuteQuery(query, selector) as unknown as Promise<R[]|null>;
  }

  getTable = () => this.pgTable;

  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const select = Query.select(this.pgTable, selector, options);
        const result = await this.executeQuery<T>(select, selector);
        return result as unknown as T[];
      },
      count: async () => {
        const select = Query.select(this.pgTable, selector, options, {count: true});
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
    const select = Query.select<T>(this.pgTable, selector, {limit: 1, ...options, projection});
    const result = await this.executeQuery<T>(select, selector);
    return result ? result[0] as unknown as T : null;
  }

  findOneArbitrary = async (): Promise<T|null> => {
    const select = Query.select<T>(this.pgTable, undefined, {limit: 1});
    const result = await this.executeQuery<T>(select);
    return result ? result[0] as unknown as T : null;
  }

  // TODO: What can the options be?
  rawInsert = async (doc: any, options: any) => { // TODO types
    const insert = Query.insert<T>(this.pgTable, doc, options);
    await this.executeQuery(insert, doc);
  }

  rawUpdateOne = async (
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T>,
  ) => {
    const update = Query.update<T>(this.table, selector, modifier, options, 1);
    throw new Error("PgCollection: rawUpdateOne not yet implemented");
  }

  rawUpdateMany = async (
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T>,
  ) => {
    const update = Query.update<T>(this.table, selector, modifier, options);
    throw new Error("PgCollection: rawUpdateMany not yet implemented");
  }

  rawRemove = async (selector: string | MongoSelector<T>, options?: any) => { // TODO: Type of options
    throw new Error("PgCollection: rawRemove not yet implemented");
  }

  // TODO: What are the options?
  _ensureIndex = async (fieldOrSpec: string | Record<string, any>, options_: any) => {
    const index = typeof fieldOrSpec === "string" ? [fieldOrSpec] : Object.keys(fieldOrSpec);
    if (!this.pgTable.hasIndex(index)) {
      this.pgTable.addIndex(index);
      const sql = this.getSqlClient();
      const query = this.pgTable.buildCreateIndexSQL(sql, index);
      await query;
    }
  }

  aggregate = (pipeline: MongoAggregationPipeline<T>, options?: MongoAggregationOptions) => {
    return {
      toArray: async () => {
        try {
          const query = new Pipeline<T>(this.pgTable, pipeline, options).toQuery();
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
