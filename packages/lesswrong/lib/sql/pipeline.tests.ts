import { testStartup } from "../../testing/testMain";
import { testTable, runTestCases } from "./testHelpers";
import Pipeline from "./Pipeline";

testStartup();

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
      expectedSql: 'SELECT * FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC LIMIT $2',
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
      expectedSql: 'SELECT * FROM ( SELECT * FROM "TestCollection" WHERE "a" = $1 ORDER BY "b" DESC LIMIT $2 ) A WHERE "b" = $3',
      expectedArgs: [3, 10, "test"],
    },
  ]);
});
