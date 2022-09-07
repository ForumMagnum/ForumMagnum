import { testStartup } from "../../testing/testMain";
import { DbTestObject, testTable, runTestCases } from "./testHelpers";
import Query from "./Query";

testStartup();

describe("Query", () => {
  runTestCases([
    {
      name: "can build simple select query",
      getQuery: () => Query.select(testTable),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection"',
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
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1',
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
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $and array selector",
      getQuery: () => Query.select(testTable, {$and: [{a: 3}, {b: "b"}]}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with implicit $and selector",
      getQuery: () => Query.select(testTable, {a: 3, b: "b"}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or object selector",
      getQuery: () => Query.select(testTable, {$or: {a: 3, b: "b"}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or array selector",
      getQuery: () => Query.select(testTable, {$or: [{a: 3}, {b: "b"}]}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with nested boolean combiners",
      getQuery: () => Query.select(testTable, {a: 3, $or: [{b: "hello"}, {c: {$exists: false}}]}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND ( "b" = $2 OR "c" IS NULL ) )',
      expectedArgs: [3, "hello"],
    },
    {
      name: "can build select query with comparison against null",
      getQuery: () => Query.select(testTable, {a: null}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with equal comparison",
      getQuery: () => Query.select(testTable, {a: {$eq: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with not-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$ne: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" <> $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than comparison",
      getQuery: () => Query.select(testTable, {a: {$lt: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" < $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than-or-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$lte: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" <= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than comparison",
      getQuery: () => Query.select(testTable, {a: {$gt: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" > $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than-or-equal comparison",
      getQuery: () => Query.select(testTable, {a: {$gte: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" >= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with in comparison",
      getQuery: () => Query.select(testTable, {a: {$in: [1, 2, 3]}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = ANY(ARRAY[ $1 , $2 , $3 ]::REAL[])',
      expectedArgs: [1, 2, 3],
    },
    {
      name: "can build select query with not-in comparison",
      getQuery: () => Query.select(testTable, {a: {$nin: [1, 2, 3]}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" <> ANY(ARRAY[ $1 , $2 , $3 ]::REAL[])',
      expectedArgs: [1, 2, 3],
    },
    {
      name: "can build select query with exists check",
      getQuery: () => Query.select(testTable, {a: {$exists: true}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" IS NOT NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with not-exists check",
      getQuery: () => Query.select(testTable, {a: {$exists: false}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with json fields",
      getQuery: () => Query.select(testTable, {"c.d.e": 3}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ("c"->\'d\'->\'e\')::INTEGER = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with sort",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {sort: {b: -1}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC',
      expectedArgs: [3],
    },
    {
      name: "can build select query with limit",
      getQuery: () => Query.select(testTable, {a: 3}, {limit: 10}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 LIMIT $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with skip",
      getQuery: () => Query.select(testTable, {a: 3}, {skip: 10}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 OFFSET $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with multiple options",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {sort: {b: -1}, limit: 10, skip: 20}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC LIMIT $2 OFFSET $3',
      expectedArgs: [3, 10, 20],
    },
    {
      name: "can build select query with comment",
      getQuery: () => Query.select(testTable, {a: 3, $comment: "Test comment"}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 )',
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
      expectedSql: 'SELECT * FROM ( SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ) A WHERE "b" = $2',
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
    {
      name: "can build select with fields included through projection",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {projection: {b: 1}}),
      expectedSql: 'SELECT "b", "_id" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields excluded through projection",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {projection: {b: 0}}),
      expectedSql: 'SELECT "_id", "a", "c", "schemaVersion" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields included and excluded through projection",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {projection: {a: 0, b: 1}}),
      expectedSql: 'SELECT "b", "_id" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with empty projection",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {projection: {}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with _id excluded through projection",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {projection: {_id: 0}}),
      expectedSql: 'SELECT "a", "b", "c", "schemaVersion" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields added in a projection",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {projection: {
        k: {
          '$cond': {
            if: '$b',
            then: '$b',
            else: "default-value",
          },
        },
      }}),
      expectedSql: 'SELECT "TestCollection".* , (CASE WHEN "b" IS NOT NULL THEN "b" ELSE $1 END) AS "k" FROM "TestCollection" WHERE "a" = $2',
      expectedArgs: ["default-value", 3],
    },
    {
      name: "can build select with arithmetic synthetic fields",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {}, {
        addFields: {
          k: {
            $multiply: [
              { $add: ["$a", 8], },
              6,
            ],
          },
        },
      }),
      expectedSql: 'SELECT "TestCollection".* , ( ( "a" + $1 ) * $2 ) AS "k" FROM "TestCollection" WHERE "a" = $3',
      expectedArgs: [8, 6, 3],
    },
    {
      name: "can build select with conditional synthetic fields",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {}, {
        addFields: {
          k: {
            $cond: {
              if: "$a",
              then: 2,
              else: 4,
            },
          },
        },
      }),
      expectedSql: 'SELECT "TestCollection".* , (CASE WHEN "a" IS NOT NULL THEN $1 ELSE $2 END) ::INTEGER AS "k" FROM "TestCollection" WHERE "a" = $3',
      expectedArgs: [2, 4, 3],
    },
    {
      name: "can build select with date diff",
      getQuery: () => Query.select<DbTestObject>(testTable, {a: 3}, {}, {
        addFields: {
          k: {
            $subtract: [new Date('2022-01-01'), "$b"],
          },
        },
      }),
      expectedSql: 'SELECT "TestCollection".* , (1000 * EXTRACT(EPOCH FROM $1 - "b" )) AS "k" FROM "TestCollection" WHERE "a" = $2',
      expectedArgs: [new Date('2022-01-01'), 3],
    },
    {
      name: "can build update with $set",
      getQuery: () => Query.update<DbTestObject>(testTable, {a: 3}, {$set: {b: "test", c: "another-test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 , "c" = $2 WHERE "a" = $3',
      expectedArgs: ["test", "another-test", 3],
    },
    {
      name: "can build update with $unset",
      getQuery: () => Query.update<DbTestObject>(testTable, {a: 3}, {$unset: {b: ""}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE "a" = $2',
      expectedArgs: [null, 3],
    },
    {
      name: "can build update with $set and $unset",
      getQuery: () => Query.update<DbTestObject>(testTable, {a: 3}, {$unset: {b: ""}, $set: {c: "test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "c" = $1 , "b" = $2 WHERE "a" = $3',
      expectedArgs: ["test", null, 3],
    },
    {
      name: "can build update with string selector",
      getQuery: () => Query.update<DbTestObject>(testTable, "some-id", {$set: {b: "test"}}),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE "_id" = $2',
      expectedArgs: ["test", "some-id"],
    },
    {
      name: "can build update with limit and no selector",
      getQuery: () => Query.update<DbTestObject>(testTable, {}, {$set: {b: "test"}}, {}, 1),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE _id IN ( SELECT "_id" FROM "TestCollection" LIMIT $2 )',
      expectedArgs: ["test", 1],
    },
    {
      name: "can build update with limit and selector",
      getQuery: () => Query.update<DbTestObject>(testTable, {a: 3}, {$set: {b: "test"}}, {}, 1),
      expectedSql: 'UPDATE "TestCollection" SET "b" = $1 WHERE _id IN ( SELECT "_id" FROM "TestCollection" WHERE "a" = $2 LIMIT $3 )',
      expectedArgs: ["test", 3, 1],
    },
  ]);
});
