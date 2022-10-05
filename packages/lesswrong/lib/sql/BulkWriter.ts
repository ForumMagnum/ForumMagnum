import Query from "./Query";
import Table from "./Table";
import InsertQuery from "./InsertQuery";
import UpdateQuery from "./UpdateQuery";
import DeleteQuery from "./DeleteQuery";

export type BulkWriterResult = {
  ok: number,
}

class BulkWriter<T extends DbObject> {
  private queries: Query<T>[] = [];

  constructor(table: Table, operations: MongoBulkWriteOperations<T>, _options: MongoBulkWriteOptions) {
    const inserts: MongoBulkInsert<T>[] = [];
    const updateOnes: MongoBulkUpdate<T>[] = [];
    const updateManys: MongoBulkUpdate<T>[] = [];
    const deleteOnes: MongoBulkDelete<T>[] = [];
    const deleteManys: MongoBulkDelete<T>[] = [];
    const replaces: MongoBulkReplace<T>[] = [];

    for (const op of operations) {
      const opName = Object.keys(op)[0];
      const opValue = op[opName];
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
      this.queries = this.queries.concat(updateOnes.map(({filter, update, upsert}) => upsert
        ? new InsertQuery(table, update as T, {}, {conflictStrategy: "upsert", upsertSelector: filter})
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
    if (!deleteManys.length) {
      this.queries = this.queries.concat(deleteManys.map(({filter}) => new DeleteQuery(table, filter, {})));
    }
    if (replaces.length) {
      // Currently not used in our code base and it's complicated to implement...
      throw new Error("replaceOne in bulkWrite not implemented");
    }
  }

  async execute(client: SqlClient): Promise<BulkWriterResult> {
    await Promise.all(this.queries.map((query) => {
      const {sql, args} = query.compile();
      return client.any(sql, args);
    }));
    return {
      ok: 1,
    };
  }
}

export default BulkWriter;
