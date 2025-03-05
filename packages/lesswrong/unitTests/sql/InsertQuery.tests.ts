import { DbTestObject, testTable, runTestCases, testTable5, DbTestObject5 } from "@/server/sql/tests/testHelpers";
import InsertQuery from "@/server/sql/InsertQuery";

jest.mock('../../lib/random', () => ({
  randomId: () => "some-random-id",
}));

describe("InsertQuery", () => {
  runTestCases([
    {
      name: "can build insert query",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, {_id: "abc", a: 3, b: "test", c: {d: {e: "a" }}, schemaVersion: 1}),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 )',
      expectedArgs: ["abc", 3, "test", {d: {e: "a" }}, null, 1],
    },
    {
      name: "generates a random insertion ID if _id is missing",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, {_id: "", a: 3, b: "test", c: {d: {e: "a" }}, schemaVersion: 1}),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 )',
      expectedArgs: ["some-random-id", 3, "test", {d: {e: "a" }}, null, 1],
    },
    {
      name: "can build insert query returning the result",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {returnInserted: true},
      ),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) RETURNING *',
      expectedArgs: ["abc", 3, "test", null, null, 1],
    },
    {
      name: "can build insert query ignoring conflicts",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "ignore"},
      ),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) ON CONFLICT DO NOTHING',
      expectedArgs: ["abc", 3, "test", null, null, 1],
    },
    {
      name: "can build insert query updating on conflicts without selector",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert"},
      ),
      expectedSql: `INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) ON CONFLICT ( _id ) DO UPDATE SET "a" = $7 , "b" = $8 , "schemaVersion" = $9 RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"`,
      expectedArgs: ["abc", 3, "test", null, null, 1, 3, "test", 1],
    },
    {
      name: "can build insert query updating on conflicts with selector",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert", upsertSelector: {b: "test2"}},
      ),
      expectedSql: `INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) ON CONFLICT ( COALESCE("b", '') ) DO UPDATE SET "a" = $7 , "b" = $8 , "schemaVersion" = $9 RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"`,
      expectedArgs: ["abc", 3, "test2", null, null, 1, 3, "test2", 1],
    },
    {
      name: "can build insert query updating on conflicts with $max operator",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", $max: {a: 5}, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert"},
      ),
      expectedSql: `INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) ON CONFLICT ( _id ) DO UPDATE SET "a" = GREATEST( "TestCollection". "a" , $7 ) , "b" = $8 , "schemaVersion" = $9 RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"`,
      expectedArgs: ["abc", 5, "test", null, null, 1, 5, "test", 1],
    },
    {
      name: "can build insert query updating on conflicts with $min operator",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", $min: {a: 5}, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert"},
      ),
      expectedSql: `INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) ON CONFLICT ( _id ) DO UPDATE SET "a" = LEAST( "TestCollection". "a" , $7 ) , "b" = $8 , "schemaVersion" = $9 RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"`,
      expectedArgs: ["abc", 5, "test", null, null, 1, 5, "test", 1],
    },
    {
      name: "can build insert query updating on conflicts with $push operator",
      getQuery: () => new InsertQuery<DbTestObject>(
        testTable,
        {_id: "abc", $push: {a: 5}, b: "test", schemaVersion: 1},
        {},
        {conflictStrategy: "upsert"},
      ),
      expectedSql: `INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) ON CONFLICT ( _id ) DO UPDATE SET "a" = ARRAY_APPEND( "TestCollection". "a" , $7 ) , "b" = $8 , "schemaVersion" = $9 RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"`,
      expectedArgs: ["abc", [5], "test", null, null, 1, 5, "test", 1],
    },
    {
      name: "can build insert query with multiple items",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, [
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {_id: "def", a: 4, b: "test2", c: {d: {e: "value"}}, schemaVersion: 1},
      ]),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "d" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6 ) , ( $7 , $8 , $9 , $10 , $11 , $12 )',
      expectedArgs: ["abc", 3, "test", null, null, 1, "def", 4, "test2", {d: {e: "value"}}, null, 1],
    },
    {
      name: "insert data must not be empty",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, []),
      expectedError: "Empty insert data",
    },
    {
      name: "cannot upsert with multiple items",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, [
        {_id: "abc", a: 3, b: "test", schemaVersion: 1},
        {_id: "def", a: 4, b: "test2", c: {d: {e: "value"}}, schemaVersion: 1},
      ], {}, {conflictStrategy: "upsert"}),
      expectedError: "Cannot use conflictStrategy 'upsert' when inserting multiple rows",
    },
    {
      name: "can correctly cast and add a type hint for primitive (non-array and non-object) values in a JSONB field",
      getQuery: () => new InsertQuery<DbTestObject5>(testTable5, {_id: "abc", jsonField: "test", schemaVersion: 1}),
      expectedSql: `INSERT INTO "TestCollection5" ( "_id" , "jsonField" , "schemaVersion" ) VALUES ( $1 , $2::JSONB , $3 )`,
      expectedArgs: ["abc", '"test"', 1],
    },
  ]);
});

