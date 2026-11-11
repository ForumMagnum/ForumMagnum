import { testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import Pipeline from "@/server/sql/Pipeline";

describe("Pipeline", () => {
  runTestCases([
    {
      name: "can build simple aggregation",
      getQuery: () => new Pipeline(testTable, [
        {
          $match: {
            a: 3,
          },
        },
        {
          $sort: {
            b: -1,
          },
        },
        {
          $limit: 10,
        },
      ]).toQuery(),
      expectedSql: 'SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC NULLS LAST LIMIT $2',
      expectedArgs: [3, 10],
    },
    {
      name: "can build multi-unit aggregation",
      getQuery: () => new Pipeline(testTable, [
        {
          $match: {
            a: 3,
          },
        },
        {
          $sort: {
            b: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $match: {
            b: "test",
          },
        },
      ]).toQuery(),
      expectedSql: 'SELECT * FROM ( SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC NULLS LAST LIMIT $2 ) A WHERE "b" = $3',
      expectedArgs: [3, 10, "test"],
    },
    {
      name: "attaches the comment to the outermost query",
      getQuery: () => new Pipeline(testTable, [
        {
          $match: {
            a: 3,
          },
        },
        {
          $limit: 10,
        },
        {
          $match: {
            b: "test",
          },
        },
      ], undefined, "TestCollection.someView").toQuery(),
      expectedSql: '-- TestCollection.someView SELECT * FROM ( SELECT "TestCollection".* FROM "TestCollection" WHERE "a" = $1 LIMIT $2 ) A WHERE "b" = $3',
      expectedArgs: [3, 10, "test"],
    },
    {
      name: "rejects a projected field name that isn't an identifier",
      getQuery: () => new Pipeline(testTable, [
        {
          $project: {
            'b" 2': 1,
          },
        },
      ]).toQuery(),
      expectedError: "Invalid SQL identifier",
    },
  ]);
});
