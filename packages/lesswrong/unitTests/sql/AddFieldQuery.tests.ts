import { DbTestObject, testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import AddFieldQuery from "../../lib/sql/AddFieldQuery";

describe("AddFieldQuery", () => {
  runTestCases([
    {
      name: "can add a new field",
      getQuery: () => new AddFieldQuery<DbTestObject>(testTable, "b"),
      expectedSql: 'ALTER TABLE "TestCollection" ADD COLUMN IF NOT EXISTS "b" TEXT',
      expectedArgs: [],
    },
  ]);
});
