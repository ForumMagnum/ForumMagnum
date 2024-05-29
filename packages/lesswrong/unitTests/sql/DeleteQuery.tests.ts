import { DbTestObject, testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import DeleteQuery from "@/server/sql/DeleteQuery";

describe("DeleteQuery", () => {
  runTestCases([
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
      name: "cannot build delete with no selector without 'noSafetyHarness'",
      getQuery: () => new DeleteQuery<DbTestObject>(testTable, {}, {}),
      expectedError: "You're trying to delete every record in a table - this is probably incorrect",
    },
    {
      name: "can build delete with no selector with 'noSafetyHarness'",
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
  ]);
});
