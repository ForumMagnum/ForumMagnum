import { DbTestObject, testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import UpdateQuery from "../../lib/sql/UpdateQuery";

describe("UpdateQuery", () => {
  runTestCases([
    {
      name: "can build update with $set",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {b: "test", c: "another-test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 , "c" = $2 WHERE "a" = $3',
      expectedArgs: ["test", "another-test", 3],
    },
    {
      name: "can build update with $unset",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$unset: {b: ""}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE "a" = $2',
      expectedArgs: [null, 3],
    },
    {
      name: "can build update with $set and $unset",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$unset: {b: ""}, $set: {c: "test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "c" = $1 , "b" = $2 WHERE "a" = $3',
      expectedArgs: ["test", null, 3],
    },
    {
      name: "can build update with string selector",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, "some-id", {$set: {b: "test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE "_id" = $2',
      expectedArgs: ["test", "some-id"],
    },
    {
      name: "can build update with limit and no selector",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {}, {$set: {b: "test"}}, {}, {limit: 1}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE _id IN ( SELECT "_id" FROM "TestCollection" LIMIT $2 FOR UPDATE)',
      expectedArgs: ["test", 1],
    },
    {
      name: "can build update with limit and selector",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {b: "test"}}, {}, {limit: 1}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE _id IN ( SELECT "_id" FROM "TestCollection" WHERE "a" = $2 LIMIT $3 FOR UPDATE )',
      expectedArgs: ["test", 3, 1],
    },
    {
      name: "can build update that returns the result",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {b: "test"}}, {}, {returnUpdated: true}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE "a" = $2 RETURNING *',
      expectedArgs: ["test", 3],
    },
    {
      name: "can build update with $set on a json field",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {c: {d: {e: "test"}}}}),
      expectedSql: 'UPDATE "TestCollection" SET "c" = $1 WHERE "a" = $2',
      expectedArgs: [{d: {e: "test"}}, 3],
    },
    {
      name: "can build update with $push",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$push: {b: 2}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = ARRAY_APPEND( "b" , $1 ) WHERE "a" = $2',
      expectedArgs: [2, 3],
    },
    {
      name: "can build update with $inc",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$inc: {a: 1}}),
      expectedSql: 'UPDATE "TestCollection" SET "a" = COALESCE( "a" , 0 ) + $1 WHERE "a" = $2',
      expectedArgs: [1, 3],
    },
    {
      name: "can set a value inside a JSON blob",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {"c.d.e": "hello world"}}),
      expectedSql: `UPDATE "TestCollection" SET "c" = JSONB_SET( "c" , '{d, e}' , $1 , TRUE) WHERE "a" = $2`,
      expectedArgs: ["hello world", 3],
    },
    {
      name: "can add a value to a set",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$addToSet: {b: "hello world"}}),
      expectedSql: `UPDATE "TestCollection" SET "b" = fm_add_to_set( "b" , $1 ) WHERE "a" = $2`,
      expectedArgs: ["hello world", 3],
    },
  ]);
});
