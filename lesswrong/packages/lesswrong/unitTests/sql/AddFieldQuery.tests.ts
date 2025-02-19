import { DbTestObject, testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import AddFieldQuery from "@/server/sql/AddFieldQuery";

describe("AddFieldQuery", () => {
  runTestCases([
    {
      name: "can add a new field",
      getQuery: () => new AddFieldQuery<DbTestObject>(testTable, "b"),
      expectedSql: 'ALTER TABLE "TestCollection" ADD COLUMN IF NOT EXISTS "b" TEXT',
      expectedArgs: [],
    },
    {
      name: "throws an error if passed an invalid field name",
      getQuery: () => new AddFieldQuery<DbTestObject>(testTable, "some-field-name"),
      expectedError: 'Field "some-field-name" does not exist in the schema',
    },
  ]);
});
