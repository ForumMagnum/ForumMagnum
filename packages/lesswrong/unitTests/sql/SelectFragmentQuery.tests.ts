import SelectFragmentQuery from "@/server/sql/SelectFragmentQuery";
import { createSqlFragmentFromAst } from "@/server/sql/SqlFragment";
import { runTestCases } from "@/server/sql/tests/testHelpers";
import { TestCollection4DefaultFragment, TestCollection4ArgFragment, TestCollection3DefaultFragment, TestCollection2DefaultFragment } from "@/server/sql/tests/testFragments";
import { Kind, type DocumentNode, type FragmentDefinitionNode } from "graphql";

const getFragmentDefs = (...docs: DocumentNode[]): FragmentDefinitionNode[] => {
  return docs.flatMap(doc => doc.definitions).filter(def => def.kind === Kind.FRAGMENT_DEFINITION);
};

describe("SelectFragmentQuery", () => {
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
