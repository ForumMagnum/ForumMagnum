import Query from "./Query";
import Table from "./Table";
import InsertQuery from "./InsertQuery";
import UpdateQuery from "./UpdateQuery";
import DeleteQuery from "./DeleteQuery";

export type BulkWriterResult = {
  ok: number,
}

/**
 * This class acts as a helper to facilitate the Mongo `bulkWrite` operation.
 *
 * It takes an arbitrary number of write operations and performs them in
 * sequence. No guarantees are made about ordering, and performance characteristics
 * will almost certainly be different to Mongo.
 *
 * We don't implement the `replaceOne` operation here as it's not used in our codebase
 * and it's non-trivial to implement the correct semantics in Postgres.
 */
class BulkWriter<T extends DbObject> {
  private queries: Query<T>[] = [];

  constructor(table: Table<T>, operations: MongoBulkWriteOperations<T>, _options?: MongoBulkWriteOptions) {
    const inserts: MongoBulkInsert<T>[] = [];
    const updateOnes: MongoBulkUpdate<T>[] = [];
    const updateManys: MongoBulkUpdate<T>[] = [];
    const deleteOnes: MongoBulkDelete<T>[] = [];
    const deleteManys: MongoBulkDelete<T>[] = [];
    const replaces: MongoBulkReplace<T>[] = [];

    for (const op of operations) {
      const opName = Object.keys(op)[0];
      const opValue = (op as AnyBecauseTodo)[opName];
      switch (opName) {
        case "insertOne":
          inserts.push(opValue);
          break;
        case "updateOne":
          updateOnes.push(opValue);
          break;
        case "updateMany":
          updateManys.push(opValue);
          break;
        case "deleteOne":
          deleteOnes.push(opValue);
          break;
        case "deleteMany":
          deleteManys.push(opValue);
          break;
        case "replaceOne":
          replaces.push(opValue);
          break;
        default:
          throw new Error(`Invalid bulk write operation: ${opName}`);
      }
    }

    if (inserts.length) {
      this.queries.push(new InsertQuery(table, inserts.map(({document}) => document)));
    }
    if (updateOnes.length) {
      this.queries = this.queries.concat(updateOnes.map(({filter, update, upsert}) => upsert && update['$set']
        ? new InsertQuery(table, update['$set'], {}, {conflictStrategy: "upsert", upsertSelector: filter})
        : new UpdateQuery(table, filter, update)
      ));
    }
    if (updateManys.length) {
      this.queries = this.queries.concat(updateManys.map(({filter, update, upsert}) => {
        if (upsert) {
          throw new Error("Upsert not implemented for multi-updates");
        }
        return new UpdateQuery(table, filter, update);
      }));
    }
    if (deleteOnes.length) {
      this.queries = this.queries.concat(deleteOnes.map(({filter}) => new DeleteQuery(table, filter, {}, {limit: 1})));
    }
    if (deleteManys.length) {
      this.queries = this.queries.concat(deleteManys.map(({filter}) => new DeleteQuery(table, filter, {})));
    }
    if (replaces.length) {
      // Currently not used in our code base and it's complicated to implement...
      throw new Error("replaceOne in bulkWrite not implemented");
    }
  }

  getQueries() {
    return this.queries;
  }

  async execute(client: SqlClient): Promise<BulkWriterResult> {
    if (this.queries.length) {
      await client.multi(client.concat(this.queries));
    }
    return {
      ok: 1,
    };
  }
}

export default BulkWriter;
