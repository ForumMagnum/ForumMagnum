import { DbTestObject, testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import InsertQuery from "../../lib/sql/InsertQuery";

describe("InsertQuery", () => {
  runTestCases([
    {
      name: "can build insert query",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, {_id: "abc", a: 3, b: "test", c: {d: {e: "a" }}, schemaVersion: 1}),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 )',
      expectedArgs: ["abc", 3, "test", {d: {e: "a" }}, 1],
    },
    {
      name: "can build insert query returning the result",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {returnInserted: true},
      ),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 ) RETURNING *',
      expectedArgs: ["abc", 3, "test", null, 1],
    },
    {
      name: "can build insert query ignoring conflicts",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "ignore"},
      ),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 ) ON CONFLICT DO NOTHING',
      expectedArgs: ["abc", 3, "test", null, 1],
    },
    {
      name: "can build insert query updating on conflicts without selector",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert"},
      ),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 ) ON CONFLICT ( _id ) DO UPDATE SET "a" = $6 , "b" = $7 , "schemaVersion" = $8',
      expectedArgs: ["abc", 3, "test", null, 1, 3, "test", 1],
    },
    {
      name: "can build insert query updating on conflicts with selector",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert", upsertSelector: {b: "test2"}},
      ),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 ) ON CONFLICT ( COALESCE("b", \'\') ) DO UPDATE SET "a" = $6 , "b" = $7 , "schemaVersion" = $8',
      expectedArgs: ["abc", 3, "test2", null, 1, 3, "test2", 1],
    },
    {
      name: "can build insert query with multiple items",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, [
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {_id: "def", a: 4, b: "test2", c: {d: {e: "value"}}, schemaVersion: 1},
      ]),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 ) , ( $6 , $7 , $8 , $9 , $10 )',
      expectedArgs: ["abc", 3, "test", null, 1, "def", 4, "test2", {d: {e: "value"}}, 1],
    },
  ]);
});
