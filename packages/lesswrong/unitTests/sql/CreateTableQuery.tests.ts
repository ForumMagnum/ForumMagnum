import { testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import CreateTableQuery from "@/server/sql/CreateTableQuery";

describe("CreateTableQuery", () => {
  runTestCases([
    {
      name: "can build create table query",
      getQuery: () => new CreateTableQuery(testTable),
      expectedSql: 'CREATE TABLE "TestCollection" (_id VARCHAR(27) PRIMARY KEY , "a" DOUBLE PRECISION DEFAULT 3 , "b" TEXT , "c" JSONB , "d" TEXT[] , "schemaVersion" DOUBLE PRECISION )',
      expectedArgs: [],
    },
    {
      name: "can build create table query with 'if not exists'",
      getQuery: () => new CreateTableQuery(testTable, true),
      expectedSql: 'CREATE TABLE IF NOT EXISTS "TestCollection" (_id VARCHAR(27) PRIMARY KEY , "a" DOUBLE PRECISION DEFAULT 3 , "b" TEXT , "c" JSONB , "d" TEXT[] , "schemaVersion" DOUBLE PRECISION )',
      expectedArgs: [],
    },
  ]);
});
