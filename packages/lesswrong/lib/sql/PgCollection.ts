import { MongoCollection, getSqlClient } from "../mongoCollection";
import Table from "./Table";
import Select from "./Select";

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
      throw new Error("Sql client is not initialized");
    }
    return sql;
  }

  getTable = () => {
    throw new Error("PgCollection: getTable not yet implemented");
  }

  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const select = new Select(this.pgTable, selector, options);
        const result = await select.toSQL(this.getSqlClient());
        return result as unknown as T[];
      },
      count: async () => {
        const select = new Select(this.pgTable, selector, options);
        const result = await select.toCountSQL(this.getSqlClient());
        return result?.count ?? 0;
      },
    };
  }

  findOne = async (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): Promise<T|null> => {
    const select = new Select(this.pgTable, selector, {limit: 1, ...options});
    const result = await select.toSQL(this.getSqlClient());
    return result ? result[0] as unknown as T : null;
  }

  findOneArbitrary = async (): Promise<T|null> => {
    const select = new Select(this.pgTable, undefined, {limit: 1});
    const result = await select.toSQL(this.getSqlClient());
    return result ? result[0] as unknown as T : null;
  }

  rawInsert = async (doc, options) => {
    // TODO: What are the options?
    await this.pgTable.toInsertSQL(this.getSqlClient(), doc);
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
