import { MongoCollection, getSqlClient } from "../mongoCollection";
import Table from "./Table";

class PgCollection<T extends DbObject> extends MongoCollection<T> {
  pgTable: Table;

  constructor(tableName: string, options?: { _suppressSameNameError?: boolean }) {
    super(tableName, options);
  }

  buildPostgresTable() {
    this.pgTable = Table.fromCollection(this as unknown as CollectionBase<T>);
  }

  getTable = () => {
    throw new Error("PgCollection: getTable not yet implemented");
  }

  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>): FindResult<T> => {
    throw new Error("PgCollection: find not yet implemented");
  }

  findOne = async (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): Promise<T|null> => {
    throw new Error("PgCollection: findOne not yet implemented");
  }

  findOneArbitrary = async (): Promise<T|null> => {
    throw new Error("PgCollection: findOneArbitrary not yet implemented");
  }

  rawInsert = async (doc, options) => {
    throw new Error("PgCollection: rawInsert not yet implemented");
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

  _ensureIndex = async (fieldOrSpec, options)=>{
    throw new Error("PgCollection: _ensureIndex not yet implemented");
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
