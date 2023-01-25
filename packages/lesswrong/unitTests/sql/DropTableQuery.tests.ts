import { testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import DropTableQuery from "../../lib/sql/DropTableQuery";

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
