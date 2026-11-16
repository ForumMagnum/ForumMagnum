import SelectFragmentQuery from "@/server/sql/SelectFragmentQuery";
import { createSqlFragmentFromAst } from "@/server/sql/SqlFragment";
import { runTestCases } from "@/server/sql/tests/testHelpers";
import { TestCollection4DefaultFragment, TestCollection4ArgFragment, TestCollection3DefaultFragment, TestCollection2DefaultFragment, TestCollection4IdFragment } from "@/server/sql/tests/testFragments";
import { Kind, type DocumentNode, type FragmentDefinitionNode } from "graphql";
import { enableCustomSqlResolvers } from "@/server/sql/ProjectionContext";

const getFragmentDefs = (...docs: DocumentNode[]): FragmentDefinitionNode[] => {
  return docs.flatMap(doc => doc.definitions).filter(def => def.kind === Kind.FRAGMENT_DEFINITION);
};

describe("SelectFragmentQuery", () => {
  if (!enableCustomSqlResolvers) {
    it('has auto-generated joins disabled', ()=>{});
    return;
  }
  runTestCases([
    {
      name: "can build fragment queries with a where clause",
      getQuery: () => new SelectFragmentQuery(
        createSqlFragmentFromAst('TestCollection4DefaultFragment', getFragmentDefs(TestCollection4DefaultFragment, TestCollection3DefaultFragment)),
        {_id: "test-user-id"} as DbUser,
        null,
        {_id: "test-document-id"},
        undefined,
        undefined,
        () => "q",
      ),
      expectedSql: `
        -- Fragment TestCollection4DefaultFragment
        SELECT
          "t".*,
          CASE WHEN "q"."_id" IS NULL
            THEN NULL
            ELSE (TO_JSONB("q".*))
          END "testCollection3"
        FROM "TestCollection4" "t"
        LEFT JOIN "Users" "currentUser" ON "currentUser"."_id" = $1
        LEFT JOIN "TestCollection3" "q" ON "q"."_id" = "t"."testCollection3Id"
        WHERE "t"."_id" =  $2
      `,
      expectedArgs: ["test-user-id", "test-document-id"],
    },
    {
      name: "can build fragment queries with resolver args",
      getQuery: () => new SelectFragmentQuery(
        createSqlFragmentFromAst('TestCollection4ArgFragment', getFragmentDefs(TestCollection4ArgFragment, TestCollection2DefaultFragment)),
        {_id: "test-user-id"} as DbUser,
        {testCollection2Id: "some-test-id"},
        {_id: "test-document-id"},
        undefined,
        undefined,
        () => "q",
      ),
      expectedSql: `
        -- Fragment TestCollection4ArgFragment
        SELECT
          "t".*,
          CASE WHEN "q"."_id" IS NULL
            THEN NULL
            ELSE (TO_JSONB("q".*))
          END "testCollection2"
        FROM "TestCollection4" "t"
        LEFT JOIN "Users" "currentUser" ON "currentUser"."_id" = $1
        LEFT JOIN "TestCollection2" "q" ON "q"."_id" = $2
        WHERE "t"."_id" =  $3
      `,
      expectedArgs: ["test-user-id", "some-test-id", "test-document-id"],
    },
  ]);
});

const sortByResolverField = {sort: {testCollection3SchemaVersion: -1, _id: 1}};
const schemaVersionCopy: Record<string, string> = {schemaVersionCopy: "$schemaVersion"};
const sortByResolverAndSyntheticFields = {sort: {testCollection3SchemaVersion: -1, schemaVersionCopy: 1, _id: 1}};

describe("SelectFragmentQuery sorting", () => {
  runTestCases([
    {
      name: "can sort by a field with a SQL resolver that isn't in the fragment",
      getQuery: () => new SelectFragmentQuery(
        createSqlFragmentFromAst('TestCollection4IdFragment', getFragmentDefs(TestCollection4IdFragment)),
        {_id: "test-user-id"} as DbUser,
        null,
        {},
        undefined,
        sortByResolverField,
        () => "q",
      ),
      expectedSql: `
        -- Fragment TestCollection4IdFragment
        SELECT
          "t".*
        FROM "TestCollection4" "t"
        LEFT JOIN "Users" "currentUser" ON "currentUser"."_id" = $1
        LEFT JOIN "TestCollection3" "q" ON "q"."_id" = "t"."_id"
        ORDER BY "q"."schemaVersion" DESC NULLS LAST, "t"."_id" ASC NULLS FIRST
      `,
      expectedArgs: ["test-user-id"],
    },
    {
      name: "can sort by a field with a SQL resolver alongside a synthetic field",
      getQuery: () => new SelectFragmentQuery(
        createSqlFragmentFromAst('TestCollection4IdFragment', getFragmentDefs(TestCollection4IdFragment)),
        {_id: "test-user-id"} as DbUser,
        null,
        {},
        schemaVersionCopy,
        sortByResolverAndSyntheticFields,
        () => "q",
      ),
      expectedSql: `
        -- Fragment TestCollection4IdFragment
        SELECT
          "t".* ,
          "t"."schemaVersion" AS "schemaVersionCopy"
        FROM "TestCollection4" "t"
        LEFT JOIN "Users" "currentUser" ON "currentUser"."_id" = $1
        LEFT JOIN "TestCollection3" "q" ON "q"."_id" = "t"."_id"
        ORDER BY "q"."schemaVersion" DESC NULLS LAST, "schemaVersionCopy" ASC NULLS FIRST, "t"."_id" ASC NULLS FIRST
      `,
      expectedArgs: ["test-user-id"],
    },
  ]);
});
