import { testStartup } from "../../testing/testMain";
import { DbTestObject, testTable, testTable2, runTestCases } from "./testHelpers";
import Query from "./Query";

testStartup();

describe("Query", () => {
  runTestCases([
    {
      name: "can build simple select query",
      getQuery: () => Query.select(testTable),
      expectedSql: 'SELECT * FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build simple count query",
      getQuery: () => Query.select(testTable, {}, {}, {count: true}),
      expectedSql: 'SELECT count(*) FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build select query with where clause",
      getQuery: () => Query.select(testTable, {a: 3}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build count query with where clause",
      getQuery: () => Query.select(testTable, {a: 3}, {}, {count: true}),
      expectedSql: 'SELECT count(*) FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with $and object selector",
      getQuery: () => Query.select(testTable, {$and: {a: 3, b: "b"}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $and array selector",
      getQuery: () => Query.select(testTable, {$and: [{a: 3}, {b: "b"}]}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with implicit $and selector",
      getQuery: () => Query.select(testTable, {a: 3, b: "b"}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or object selector",
      getQuery: () => Query.select(testTable, {$or: {a: 3, b: "b"}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or array selector",
      getQuery: () => Query.select(testTable, {$or: [{a: 3}, {b: "b"}]}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with nested boolean combiners",
      getQuery: () => Query.select(testTable, {a: 3, $or: [{b: "hello"}, {c: {$exists: false}}]}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 AND ( "b" = $2 OR "c" IS NULL ) )',
      expectedArgs: [3, "hello"],
    },
    {
      name: "can build select query with comparison against null",
      getQuery: () => Query.select(testTable, {a: null}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with equal comparison",
      getQuery: () => Query.select(testTable, {a: {$eq: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with not-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$ne: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" <> $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than comparison",
      getQuery: () => Query.select(testTable, {a: {$lt: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" < $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than-or-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$lte: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" <= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than comparison",
      getQuery: () => Query.select(testTable, {a: {$gt: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" > $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than-or-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$gte: 3}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" >= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with in comparison",
      getQuery: () => Query.select(testTable, {a: {$in: [1, 2, 3]}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = ANY( $1 )',
      expectedArgs: [[1, 2, 3]],
    },
    {
      name: "can build select query with not-in comparison",
      getQuery: () => Query.select(testTable, {a: {$nin: [1, 2, 3]}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" <> ANY( $1 )',
      expectedArgs: [[1, 2, 3]],
    },
    {
      name: "can build select query with exists check",
      getQuery: () => Query.select(testTable, {a: {$exists: true}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" IS NOT NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with not-exists check",
      getQuery: () => Query.select(testTable, {a: {$exists: false}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with json fields",
      getQuery: () => Query.select(testTable, {"c.d.e": 3}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ("c"->\'d\'->\'e\')::INTEGER = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with sort",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {sort: {b: -1}}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC',
      expectedArgs: [3],
    },
    {
      name: "can build select query with limit",
      getQuery: () => Query.select(testTable, {a: 3}, {limit: 10}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 LIMIT $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with skip",
      getQuery: () => Query.select(testTable, {a: 3}, {skip: 10}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 OFFSET $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with multiple options",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {sort: {b: -1}, limit: 10, skip: 20}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC LIMIT $2 OFFSET $3',
      expectedArgs: [3, 10, 20],
    },
    {
      name: "can build select query with comment",
      getQuery: () => Query.select(testTable, {a: 3, $comment: "Test comment"}),
      expectedSql: 'SELECT * FROM "TestCollection" WHERE ( "a" = $1 )',
      expectedArgs: [3],
    },
    {
      name: "can build insert query",
      getQuery: () => Query.insert<DbTestObject>(testTable, {_id: "abc", a: 3, b: "test", schemaVersion: 1}),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 )',
      expectedArgs: ["abc", 3, "test", null, 1],
    },
    {
      name: "can build insert query allowing conflicts",
      getQuery: () => Query.insert<DbTestObject>(testTable, {_id: "abc", a: 3, b: "test", schemaVersion: 1}, true),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 ) ON CONFLICT DO NOTHING',
      expectedArgs: ["abc", 3, "test", null, 1],
    },
    {
      name: "can build select from a subquery",
      getQuery: () => Query.select(Query.select(testTable, {a: 3}), {b: "test"}),
      expectedSql: 'SELECT * FROM ( SELECT * FROM "TestCollection" WHERE "a" = $1 ) WHERE "b" = $2',
      expectedArgs: [3, "test"],
    },
    {
      name: "can build select with a simple lookup",
      getQuery: () => Query.select(testTable, {a: 3}, {}, {
        lookup: {
          from: "testcollection2",
          localField: "b",
          foreignField: "data",
          as: "data2",
        },
      }),
      expectedSql: 'SELECT * FROM "TestCollection" , LATERAL (SELECT jsonb_agg("TestCollection2".*) AS "data2" FROM "TestCollection2" WHERE "TestCollection"."b" = "TestCollection2"."data") Q WHERE "a" = $1',
      expectedArgs: [3],
    },
  ]);
});
