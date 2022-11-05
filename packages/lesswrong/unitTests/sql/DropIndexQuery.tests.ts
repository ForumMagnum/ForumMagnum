import { testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import DropIndexQuery from "../../lib/sql/DropIndexQuery";

describe("DropIndexQuery", () => {
  runTestCases([
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
