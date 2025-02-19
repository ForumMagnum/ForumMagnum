import { DbTestObject, testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import UpdateFieldTypeQuery from "@/server/sql/UpdateFieldTypeQuery";

describe("UpdateFieldTypeQuery", () => {
  runTestCases([
    {
      name: "can update a field's type",
      getQuery: () => new UpdateFieldTypeQuery<DbTestObject>(testTable, "a"),
      expectedSql: 'ALTER TABLE "TestCollection" ALTER COLUMN "a" TYPE DOUBLE PRECISION',
      expectedArgs: [],
    },
  ]);
});
