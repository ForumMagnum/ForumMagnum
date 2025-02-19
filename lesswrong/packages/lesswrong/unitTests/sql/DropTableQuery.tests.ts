import { testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import DropTableQuery from "@/server/sql/DropTableQuery";

describe("DropTableQuery", () => {
  runTestCases([
    {
      name: "can build drop table query from Table",
      getQuery: () => new DropTableQuery(testTable),
      expectedSql: 'DROP TABLE IF EXISTS "TestCollection"',
      expectedArgs: [],
    },
  ]);
});
