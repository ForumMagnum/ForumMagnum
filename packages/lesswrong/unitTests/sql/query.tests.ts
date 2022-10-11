import { DbTestObject, testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import InsertQuery from "../../lib/sql/InsertQuery";
import SelectQuery from "../../lib/sql/SelectQuery";
import UpdateQuery from "../../lib/sql/UpdateQuery";
import DeleteQuery from "../../lib/sql/DeleteQuery";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import CreateIndexQuery from "../../lib/sql/CreateIndexQuery";
import DropIndexQuery from "../../lib/sql/DropIndexQuery";

describe("Query", () => {
  runTestCases([
    {
      name: "can build simple select query",
      getQuery: () => new SelectQuery(testTable),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build simple count query",
      getQuery: () => new SelectQuery(testTable, {}, {}, {count: true}),
      expectedSql: 'SELECT count(*) FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build select query with where clause",
      getQuery: () => new SelectQuery(testTable, {a: 3}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with string selector",
      getQuery: () => new SelectQuery(testTable, "some-id"),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "_id" = $1',
      expectedArgs: ["some-id"],
    },
    {
      name: "can build count query with where clause",
      getQuery: () => new SelectQuery(testTable, {a: 3}, {}, {count: true}),
      expectedSql: 'SELECT count(*) FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with $and object selector",
      getQuery: () => new SelectQuery(testTable, {$and: {a: 3, b: "b"}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $and array selector",
      getQuery: () => new SelectQuery(testTable, {$and: [{a: 3}, {b: "b"}]}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with implicit $and selector",
      getQuery: () => new SelectQuery(testTable, {a: 3, b: "b"}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or object selector",
      getQuery: () => new SelectQuery(testTable, {$or: {a: 3, b: "b"}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with $or array selector",
      getQuery: () => new SelectQuery(testTable, {$or: [{a: 3}, {b: "b"}]}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 OR "b" = $2 )',
      expectedArgs: [3, "b"],
    },
    {
      name: "can build select query with nested boolean combiners",
      getQuery: () => new SelectQuery(testTable, {a: 3, $or: [{b: "hello"}, {c: {$exists: false}}]}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 AND ( "b" = $2 OR "c" IS NULL ) )',
      expectedArgs: [3, "hello"],
    },
    {
      name: "can build select query with comparison against null",
      getQuery: () => new SelectQuery(testTable, {a: null}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with equal comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$eq: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with not-equal comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$ne: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" <> $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$lt: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" < $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with less-than-or-equal comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$lte: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" <= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$gt: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" > $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with greater-than-or-equal comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$gte: 3}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" >= $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with in comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$in: [1, 2, 3]}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = ANY(ARRAY[ $1 , $2 , $3 ]::REAL[])',
      expectedArgs: [1, 2, 3],
    },
    {
      name: "can build select query with not-in comparison",
      getQuery: () => new SelectQuery(testTable, {a: {$nin: [1, 2, 3]}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE NOT ( "a" = ANY(ARRAY[ $1 , $2 , $3 ]::REAL[]) )',
      expectedArgs: [1, 2, 3],
    },
    {
      name: "can build select query with exists check",
      getQuery: () => new SelectQuery(testTable, {a: {$exists: true}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" IS NOT NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with not-exists check",
      getQuery: () => new SelectQuery(testTable, {a: {$exists: false}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" IS NULL',
      expectedArgs: [],
    },
    {
      name: "can build select query with json fields",
      getQuery: () => new SelectQuery(testTable, {"c.d.e": 3}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ("c"->\'d\'->\'e\')::INTEGER = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select query with sort",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {sort: {b: -1}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC',
      expectedArgs: [3],
    },
    {
      name: "can build select query with limit",
      getQuery: () => new SelectQuery(testTable, {a: 3}, {limit: 10}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 LIMIT $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with skip",
      getQuery: () => new SelectQuery(testTable, {a: 3}, {skip: 10}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 OFFSET $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build select query with multiple options",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {sort: {b: -1}, limit: 10, skip: 20}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC LIMIT $2 OFFSET $3',
      expectedArgs: [3, 10, 20],
    },
    {
      name: "can build select query with comment",
      getQuery: () => new SelectQuery(testTable, {a: 3, $comment: "Test comment"}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE ( "a" = $1 )',
      expectedArgs: [3],
    },
    {
      name: "can build insert query",
      getQuery: () => new InsertQuery<DbTestObject>(testTable, {_id: "abc", a: 3, b: "test", schemaVersion: 1}),
      expectedSql: 'INSERT INTO "TestCollection" ( "_id" , "a" , "b" , "c" , "schemaVersion" ) VALUES ( $1 , $2 , $3 , $4 , $5 )',
      expectedArgs: ["abc", 3, "test", null, 1],
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
    {
      name: "can build select from a subquery",
      getQuery: () => new SelectQuery(new SelectQuery(testTable, {a: 3}), {b: "test"}),
      expectedSql: 'SELECT * FROM ( SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ) A WHERE "b" = $2',
      expectedArgs: [3, "test"],
    },
    {
      name: "can build select with a simple lookup",
      getQuery: () => new SelectQuery(testTable, {a: 3}, {}, {
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
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {b: 1}}),
      expectedSql: 'SELECT "b", "_id" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields excluded through projection",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {b: 0}}),
      expectedSql: 'SELECT "_id", "a", "c", "schemaVersion" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields included and excluded through projection",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {a: 0, b: 1}}),
      expectedSql: 'SELECT "b", "_id" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with empty projection",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {}}),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with _id excluded through projection",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {_id: 0}}),
      expectedSql: 'SELECT "a", "b", "c", "schemaVersion" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields renamed in projection",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {data: "$c"}}),
      expectedSql: 'SELECT "TestCollection".* , "c" AS "data" FROM "TestCollection" WHERE "a" = $1',
      expectedArgs: [3],
    },
    {
      name: "can build select with fields added in a projection",
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {projection: {
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
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {}, {
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
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {}, {
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
      getQuery: () => new SelectQuery<DbTestObject>(testTable, {a: 3}, {}, {
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
      name: "can build delete with selector",
      getQuery: () => new DeleteQuery<DbTestObject>(testTable, {a: 3, b: "test"}),
      expectedSql: 'DELETE FROM "TestCollection" WHERE ( "a" = $1 AND "b" = $2 )',
      expectedArgs: [3, "test"],
    },
    {
      name: "can build delete with ID",
      getQuery: () => new DeleteQuery<DbTestObject>(testTable, "some-id"),
      expectedSql: 'DELETE FROM "TestCollection" WHERE "_id" = $1',
      expectedArgs: ["some-id"],
    },
    {
      name: "can build delete with no selector",
      getQuery: () => new DeleteQuery<DbTestObject>(testTable, {}, {}, {noSafetyHarness: true}),
      expectedSql: 'DELETE FROM "TestCollection"',
      expectedArgs: [],
    },
    {
      name: "can build delete with limit",
      getQuery: () => new DeleteQuery<DbTestObject>(testTable, {a: 3}, {}, {limit: 1}),
      expectedSql: 'DELETE FROM "TestCollection" WHERE _id IN ( SELECT "_id" FROM "TestCollection" WHERE "a" = $1 LIMIT $2 )',
      expectedArgs: [3, 1],
    },
    {
      name: "can build create table query",
      getQuery: () => new CreateTableQuery(testTable),
      expectedSql: 'CREATE TABLE "TestCollection" (_id VARCHAR(27) PRIMARY KEY , "a" REAL , "b" TEXT , "c" JSONB , "schemaVersion" REAL )',
      expectedArgs: [],
    },
    {
      name: "can build create table query with 'if not exists'",
      getQuery: () => new CreateTableQuery(testTable, true),
      expectedSql: 'CREATE TABLE IF NOT EXISTS "TestCollection" (_id VARCHAR(27) PRIMARY KEY , "a" REAL , "b" TEXT , "c" JSONB , "schemaVersion" REAL )',
      expectedArgs: [],
    },
    {
      name: "can build create index query",
      getQuery: () => new CreateIndexQuery(testTable, testTable.getIndexes()[0]),
      expectedSql: 'CREATE INDEX IF NOT EXISTS "idx_TestCollection_a_b" ON "TestCollection" USING btree ( "a" , "b" )',
      expectedArgs: [],
    },
    {
      name: "can build create index query with json field",
      getQuery: () => new CreateIndexQuery(testTable, testTable.getIndexes()[1]),
      expectedSql: 'CREATE INDEX IF NOT EXISTS "idx_TestCollection_a_c" ON "TestCollection" USING gin ( "a" , "c" )',
      expectedArgs: [],
    },
    {
      name: "can build create index query with unique constraint",
      getQuery: () => new CreateIndexQuery(testTable, testTable.getIndexes()[2]),
      expectedSql: 'CREATE UNIQUE INDEX IF NOT EXISTS "idx_TestCollection_a_b" ON "TestCollection" USING btree ( "a" , COALESCE("b", \'\') )',
      expectedArgs: [],
    },
    {
      name: "can build create index query with partial filter expression",
      getQuery: () => new CreateIndexQuery(testTable, testTable.getIndexes()[3]),
      expectedSql: 'CREATE INDEX IF NOT EXISTS "idx_TestCollection_a_b_filtered" ON "TestCollection" USING btree ( "a" , "b" ) WHERE ( "a" > $1 AND "b" = $2 )',
      expectedArgs: [3, "test"],
    },
    {
      name: "can build drop index query from TableIndex",
      getQuery: () => new DropIndexQuery(testTable, testTable.getIndexes()[0]),
      expectedSql: 'DROP INDEX "idx_TestCollection_a_b"',
      expectedArgs: [],
    },
    {
      name: "can build drop index query from index name",
      getQuery: () => new DropIndexQuery(testTable, "myIndex"),
      expectedSql: 'DROP INDEX "myIndex"',
      expectedArgs: [],
    },
  ]);
});
