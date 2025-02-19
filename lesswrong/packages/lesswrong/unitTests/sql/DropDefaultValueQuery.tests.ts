import { DbTestObject, testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import DropDefaultValueQuery from "@/server/sql/DropDefaultValueQuery";

describe("DropDefaultValueQuery", () => {
  runTestCases([
    {
      name: "can drop a field's default value",
      getQuery: () => new DropDefaultValueQuery<DbTestObject>(testTable, "a"),
      expectedSql: 'ALTER TABLE "TestCollection" ALTER COLUMN "a" DROP DEFAULT',
      expectedArgs: [],
    },
  ]);
});
