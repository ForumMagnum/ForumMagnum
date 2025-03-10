import { testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import DropIndexQuery from "@/server/sql/DropIndexQuery";
import TableIndex from "@/server/sql/TableIndex";

describe("DropIndexQuery", () => {
  runTestCases([
    {
      name: "can build drop index query from TableIndex",
      getQuery: () => new DropIndexQuery(testTable, new TableIndex<AnyBecauseHard>(testTable.getName(), {a: 1, b: 1})),
      expectedSql: 'DROP INDEX IF EXISTS "idx_TestCollection_a_b"',
      expectedArgs: [],
    },
    {
      name: "can build drop index query from index name",
      getQuery: () => new DropIndexQuery(testTable, "myIndex"),
      expectedSql: 'DROP INDEX IF EXISTS "myIndex"',
      expectedArgs: [],
    },
  ]);
});
