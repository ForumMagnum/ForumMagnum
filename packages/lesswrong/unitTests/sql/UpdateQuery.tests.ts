import { DbTestObject, testTable, runTestCases, testTable5, DbTestObject5 } from "@/server/sql/tests/testHelpers";
import UpdateQuery from "@/server/sql/UpdateQuery";

describe("UpdateQuery", () => {
  runTestCases([
    {
      name: "can build update with $set",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {b: "test", c: "another-test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1::TEXT , "c" = $2::JSONB WHERE "a" = $3 RETURNING "_id"',
      expectedArgs: ["test", '"another-test"', 3],
    },
    {
      name: "can build update with $unset",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$unset: {b: ""}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE "a" = $2 RETURNING "_id"',
      expectedArgs: [null, 3],
    },
    {
      name: "can build update with $set and $unset",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$unset: {b: ""}, $set: {c: "test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "c" = $1::JSONB , "b" = $2 WHERE "a" = $3 RETURNING "_id"',
      expectedArgs: ['"test"', null, 3],
    },
    {
      name: "can build update with string selector",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, "some-id", {$set: {b: "test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1::TEXT WHERE "_id" = $2 RETURNING "_id"',
      expectedArgs: ["test", "some-id"],
    },
    {
      name: "can build update with limit and no selector",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {}, {$set: {b: "test"}}, {}, {limit: 1}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1::TEXT WHERE _id IN ( SELECT "_id" FROM "TestCollection" LIMIT $2 FOR UPDATE) RETURNING "_id"',
      expectedArgs: ["test", 1],
    },
    {
      name: "can build update with limit and selector",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {b: "test"}}, {}, {limit: 1}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1::TEXT WHERE _id IN ( SELECT "_id" FROM "TestCollection" WHERE "a" = $2 LIMIT $3 FOR UPDATE ) RETURNING "_id"',
      expectedArgs: ["test", 3, 1],
    },
    {
      name: "can build update that returns the result",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {b: "test"}}, {}, {returnUpdated: true}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1::TEXT WHERE "a" = $2 RETURNING *',
      expectedArgs: ["test", 3],
    },
    {
      name: "can build update with $set on a json field",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {c: {d: {e: "test"}}}}),
      expectedSql: 'UPDATE "TestCollection" SET "c" = $1::JSONB WHERE "a" = $2 RETURNING "_id"',
      expectedArgs: [{d: {e: "test"}}, 3],
    },
    {
      name: "can build update with $push",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$push: {b: 2}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = ARRAY_APPEND( "b" , $1::INTEGER ) WHERE "a" = $2 RETURNING "_id"',
      expectedArgs: [2, 3],
    },
    {
      name: "can build update with $inc",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$inc: {a: 1}}),
      expectedSql: 'UPDATE "TestCollection" SET "a" = COALESCE( "a" , 0 ) + $1::INTEGER WHERE "a" = $2 RETURNING "_id"',
      expectedArgs: [1, 3],
    },
    {
      name: "can set a value inside a JSON blob",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {"c.d.e": "hello world"}}),
      expectedSql: `UPDATE "TestCollection" SET "c" = JSONB_SET( "c" , '{d, e}' ::TEXT[], TO_JSONB( $1::TEXT ), TRUE) WHERE "a" = $2 RETURNING "_id"`,
      expectedArgs: ["hello world", 3],
    },
    {
      name: "can delete a value at the first level of a JSON blob",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {"c.d": null}}),
      expectedSql: `UPDATE "TestCollection" SET "c" = "c" - 'd' WHERE "a" = $1 RETURNING "_id"`,
      expectedArgs: [3],
    },
    {
      name: "throws an error when trying to delete a value at a further level of a JSON blob",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {"c.d.e": null}}),
      expectedError: 'Unsetting a field past the first level of a JSON blob is not yet supported',
    },
    {
      name: "can add a value to a set (native arrays)",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$addToSet: {b: "hello world"}}),
      expectedSql: `UPDATE "TestCollection" SET "b" = fm_add_to_set( "b" , $1::TEXT ) WHERE "a" = $2 RETURNING "_id"`,
      expectedArgs: ["hello world", 3],
    },
    {
      name: "can add a value to a set (JSON arrays)",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$addToSet: {"c.d": 4}}),
      expectedSql: `UPDATE "TestCollection" SET "c" = fm_add_to_set( "c" , '{d}' ::TEXT[] , $1::INTEGER ) WHERE "a" = $2 RETURNING "_id"`,
      expectedArgs: [4, 3],
    },
    {
      name: "can add a correct type hint for native arrays of JSON in a JSONB (rather than JSONB[]) field",
      getQuery: () => new UpdateQuery<DbTestObject>(testTable, {a: 3}, {$set: {c: [{d: "test"}]}}),
      expectedSql: `UPDATE "TestCollection" SET "c" = $1::JSONB WHERE "a" = $2 RETURNING "_id"`,
      expectedArgs: ['[{"d":"test"}]', 3],
    },
    {
      name: "can correctly cast and add a type hint for primitive (non-array and non-object) values in a JSONB field",
      getQuery: () => new UpdateQuery<DbTestObject5>(testTable5, {_id: "abc"}, {$set: {jsonField: "test"}}),
      expectedSql: `UPDATE "TestCollection5" SET "jsonField" = $1::JSONB WHERE "_id" = $2 RETURNING "_id"`,
      expectedArgs: ['"test"', "abc"],
    },
    {
      name: "can correctly cast and add a type hint for arrays of primitive values (i.e. text[]) in a JSONB field",
      getQuery: () => new UpdateQuery<DbTestObject5>(testTable5, {_id: "abc"}, {$set: {jsonField: ["test", "test2"]}}),
      expectedSql: `UPDATE "TestCollection5" SET "jsonField" = $1::JSONB WHERE "_id" = $2 RETURNING "_id"`,
      expectedArgs: ['["test","test2"]', "abc"],
    },
    {
      name: "can correctly cast and add a type hint for dates in a JSONB field",
      getQuery: () => new UpdateQuery<DbTestObject5>(testTable5, {_id: "abc"}, {$set: {jsonField: new Date('2025-01-01')}}),
      expectedSql: `UPDATE "TestCollection5" SET "jsonField" = $1::JSONB WHERE "_id" = $2 RETURNING "_id"`,
      expectedArgs: [JSON.stringify(new Date('2025-01-01')), "abc"],
    },
  ]);
});

