import { testTable, runTestCases } from "@/server/sql/tests/testHelpers";
import CreateIndexQuery from "@/server/sql/CreateIndexQuery";
import TableIndex from "@/server/sql/TableIndex";

describe("CreateIndexQuery", () => {
  runTestCases([
    {
      name: "can build create index query",
      getQuery: () => new CreateIndexQuery({ table: testTable, index: new TableIndex<AnyBecauseHard>(testTable.getName(), {a: 1, b: 1}) }),
      expectedSql: 'CREATE INDEX IF NOT EXISTS "idx_TestCollection_a_b" ON "TestCollection" USING btree ( "a" , "b" )',
      expectedArgs: [],
    },
    {
      name: "can build create index query with json field",
      getQuery: () => new CreateIndexQuery({ table: testTable, index: new TableIndex<AnyBecauseHard>(testTable.getName(), {a: 1, "c.d": 1}) }),
      expectedSql: `CREATE INDEX IF NOT EXISTS "idx_TestCollection_a_c__d" ON "TestCollection" USING gin ( "a" , ("c"->'d') )`,
      expectedArgs: [],
    },
    {
      name: "can build create index query with unique constraint",
      getQuery: () => new CreateIndexQuery({ table: testTable, index: new TableIndex<AnyBecauseHard>(testTable.getName(), {a: 1, b: 1}, {unique: true}) }),
      expectedSql: 'CREATE UNIQUE INDEX IF NOT EXISTS "idx_TestCollection_a_b" ON "TestCollection" USING btree ( "a" , COALESCE("b", \'\') )',
      expectedArgs: [],
    },
    {
      name: "can build create index query with partial filter expression",
      getQuery: () => new CreateIndexQuery({ table: testTable, index: new TableIndex<AnyBecauseHard>(testTable.getName(), {a: 1, b: 1}, {partialFilterExpression: {a: {$gt: 3}, b: "test"}}) }),
      expectedSql: 'CREATE INDEX IF NOT EXISTS "idx_TestCollection_a_b_filtered" ON "TestCollection" USING btree ( "a" , "b" ) WHERE ( "a" > $1 AND "b" = $2 )',
      expectedArgs: [3, "test"],
    },
    {
      name: "can build case-insensitive create index query",
      getQuery: () => new CreateIndexQuery({ table: testTable, index: new TableIndex<AnyBecauseHard>(testTable.getName(), {b: 1}, {collation: {locale: "en", strength: 2}}) }),
      expectedSql: 'CREATE INDEX IF NOT EXISTS "idx_TestCollection_b_ci" ON "TestCollection" USING btree ( LOWER("b") )',
      expectedArgs: [],
    },
    {
      name: "can build index query with CONCURRENTLY",
      getQuery: () => new CreateIndexQuery({ table: testTable, index: new TableIndex<AnyBecauseHard>(testTable.getName(), {a: 1, c: 1}, {concurrently: true}) }),
      expectedSql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_TestCollection_a_c" ON "TestCollection" USING btree ( "a" , "c" )',
      expectedArgs: [],
    },
  ]);
});
