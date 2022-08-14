import { MongoCollection, getSqlClient } from "../mongoCollection";
import Table from "./Table";
import Query from "./Query";
import util from "util";

class PgCollection<T extends DbObject> extends MongoCollection<T> {
  pgTable: Table;

  constructor(tableName: string, options?: { _suppressSameNameError?: boolean }) {
    super(tableName, options);
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

  private async executeQuery<R extends {}>(query: Query<T>, selector?: any): Promise<R[]|null> {
    const {sql, args} = query.compile();
    try {
      return await this.getSqlClient().unsafe(sql, args) as unknown as R[]|null;
    } catch (error) {
      console.error(`SQL Error: ${error.message}: ${sql}: ${args}: ${util.inspect(selector)}`);
      throw error;
    }
  }

  getTable = () => {
    throw new Error("PgCollection: getTable not yet implemented");
  }

  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const select = Query.select(this.pgTable, selector, options);
        const result = await this.executeQuery<T>(select, selector);
        return result as unknown as T[];
      },
      count: async () => {
        const select = Query.select(this.pgTable, selector, options, true);
        const result = await this.executeQuery<{count: number}>(select, selector);
        return result?.[0].count ?? 0;
      },
    };
  }

  findOne = async (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): Promise<T|null> => {
    const select = Query.select(this.pgTable, selector, {limit: 1, ...options});
    const result = await this.executeQuery<T>(select, selector);
    return result ? result[0] as unknown as T : null;
  }

  findOneArbitrary = async (): Promise<T|null> => {
    const select = Query.select(this.pgTable, undefined, {limit: 1});
    const result = await this.executeQuery<T>(select);
    return result ? result[0] as unknown as T : null;
  }

  rawInsert = async (doc, options) => {
    // TODO: What can the options be?
    const insert = Query.insert<T>(this.pgTable, doc);
    await this.executeQuery(insert, doc);
  }

  rawUpdateOne = async (selector, update, options) => {
    throw new Error("PgCollection: rawUpdateOne not yet implemented");
  }

  rawUpdateMany = async (selector, update, options) => {
    throw new Error("PgCollection: rawUpdateMany not yet implemented");
  }

  rawRemove = async (selector, options) => {
    throw new Error("PgCollection: rawRemove not yet implemented");
  }

  _ensureIndex = async (fieldOrSpec, options) => {
    const index = typeof fieldOrSpec === "string" ? [fieldOrSpec] : Object.keys(fieldOrSpec);
    if (!this.pgTable.hasIndex(index)) {
      this.pgTable.addIndex(index);
      const sql = this.getSqlClient();
      const query = this.pgTable.buildCreateIndexSQL(sql, index);
      await query;
    }
  }

  aggregate = (pipeline, options) => {
    throw new Error("PgCollection: aggregate not yet implemented");
  }

  rawCollection = () => ({
    bulkWrite: async (operations, options) => {
      throw new Error("PgCollection: rawCollection.bulkWrite not yet implemented");
    },
    findOneAndUpdate: async (filter, update, options) => {
      throw new Error("PgCollection: rawCollection.findOneAndUpdate not yet implemented");
    },
    dropIndex: async (indexName, options) => {
      throw new Error("PgCollection: rawCollection.dropIndex not yet implemented");
    },
    indexes: async (options) => {
      throw new Error("PgCollection: rawCollection.indexes not yet implemented");
    },
    updateOne: async (selector, update, options) => {
      throw new Error("PgCollection: rawCollection.updateOne not yet implemented");
    },
    updateMany: async (selector, update, options) => {
      throw new Error("PgCollection: rawCollection.updateMany not yet implemented");
    },
  });
}

export default PgCollection;
