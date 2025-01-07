import { testTable } from "@/server/sql/tests/testHelpers";
import BulkWriter from "@/server/sql/BulkWriter";
import InsertQuery from "@/server/sql/InsertQuery";
import UpdateQuery from "@/server/sql/UpdateQuery";
import DeleteQuery from "@/server/sql/DeleteQuery";

describe("BulkWriter", () => {
  it("insertOne creates an InsertQuery", () => {
    const queries = new BulkWriter(testTable, [
      {insertOne: {document: {} as DbObject}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof InsertQuery).toBe(true);
  });
  it("updateOne creates an UpdateQuery", () => {
    const queries = new BulkWriter(testTable, [
      {updateOne: {filter: {}, update: {}}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof UpdateQuery).toBe(true);
  });
  it("updateOne creates an InsertQuery when upsert is true (and $set is defined)", () => {
    const queries = new BulkWriter(testTable, [
      {updateOne: {filter: {}, update: {$set: {b: 'hello'}}, upsert: true}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof InsertQuery).toBe(true);
  });
  it("updateOne creates an UpdateQuery when upsert is true and $set is not defined", () => {
    const queries = new BulkWriter(testTable, [
      {updateOne: {filter: {}, update: {}, upsert: true}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof UpdateQuery).toBe(true);
  });
  it("updateMany creates an UpdateQuery", () => {
    const queries = new BulkWriter(testTable, [
      {updateMany: {filter: {}, update: {}}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof UpdateQuery).toBe(true);
  });
  it("updateMany cannot use upserts", () => {
    expect(() => new BulkWriter(testTable, [
      {updateMany: {filter: {}, update: {}, upsert: true}},
    ])).toThrowError("Upsert not implemented for multi-updates");
  });
  it("deleteOne creates a DeleteQuery", () => {
    const queries = new BulkWriter(testTable, [
      {deleteOne: {filter: {a: 3}}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof DeleteQuery).toBe(true);
  });
  it("deleteMany creates a DeleteQuery", () => {
    const queries = new BulkWriter(testTable, [
      {deleteMany: {filter: {a: 3}}},
    ]).getQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0] instanceof DeleteQuery).toBe(true);
  });
  it("can combine multiple operations", () => {
    const queries = new BulkWriter(testTable, [
      {insertOne: {document: {} as DbObject}},
      {updateOne: {filter: {}, update: {}}},
      {updateMany: {filter: {}, update: {}}},
      {deleteOne: {filter: {a: 3}}},
      {deleteMany: {filter: {a: 3}}},
    ]).getQueries();
    expect(queries).toHaveLength(5);
    expect(queries[0] instanceof InsertQuery).toBe(true);
    expect(queries[1] instanceof UpdateQuery).toBe(true);
    expect(queries[2] instanceof UpdateQuery).toBe(true);
    expect(queries[3] instanceof DeleteQuery).toBe(true);
    expect(queries[4] instanceof DeleteQuery).toBe(true);
  });
  it("replaceOne is not implemented", () => {
    expect(() => new BulkWriter(testTable, [
      {replaceOne: {filter: {}, replacement: {} as DbObject}},
    ])).toThrowError("replaceOne in bulkWrite not implemented");
  });
  it("invalid operations throw an error", () => {
    expect(() => new BulkWriter(testTable, [
      {anInvalidOperation: {}} as unknown as MongoBulkWriteOperation<DbObject>,
    ])).toThrowError("Invalid bulk write operation: anInvalidOperation");
  });
  it("can execute writer queries", async () => {
    const concat = jest.fn();
    const multi = jest.fn();
    const mockSql = "some-mock-sql";
    concat.mockReturnValueOnce(mockSql);

    const client = {concat, multi} as unknown as SqlClient;
    const writer = new BulkWriter(testTable, [
      {insertOne: {document: {_id: "some-id"} as DbObject}},
      {deleteOne: {filter: {a: 3}}},
    ]);

    const result = await writer.execute(client);
    expect(result).toStrictEqual({ok: 1});

    expect(client.concat).toHaveBeenCalledTimes(1);
    expect(client.multi).toHaveBeenCalledTimes(1);
    expect(client.multi).toHaveBeenCalledWith(mockSql);
  });
});
