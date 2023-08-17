import { DbTestObject, testTable, runTestCases } from "../../lib/sql/tests/testHelpers";
import UpdateDefaultValueQuery from "../../lib/sql/UpdateDefaultValueQuery";

describe("UpdateDefaultValueQuery", () => {
  runTestCases([
    {
      name: "can update a field's default value",
      getQuery: () => new UpdateDefaultValueQuery<DbTestObject>(testTable, "a"),
      expectedSql: 'ALTER TABLE "TestCollection" ALTER COLUMN "a" SET DEFAULT 3',
      expectedArgs: [],
    },
    {
      name: "can remove a field's default value",
      getQuery: () => new UpdateDefaultValueQuery<DbTestObject>(testTable, "b"),
      expectedSql: 'ALTER TABLE "TestCollection" ALTER COLUMN "b" DROP DEFAULT',
      expectedArgs: [],
    },
  ]);
});
