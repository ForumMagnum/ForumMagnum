import SelectFragmentQuery from "../../lib/sql/SelectFragmentQuery";
import { runTestCases } from "../../lib/sql/tests/testHelpers";

describe("SelectFragmentQuery", () => {
  runTestCases([
    {
      name: "can build fragment queries with a where clause",
      getQuery: () => new SelectFragmentQuery(
        "TestCollection4DefaultFragment" as FragmentName,
        {_id: "test-user-id"} as DbUser,
        null,
        {_id: "test-document-id"},
        {},
        () => "q",
      ),
      expectedSql: `
        SELECT
          "t"."_id",
          "t"."testCollection3Id",
          CASE WHEN "q"."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
            '_id', "q"."_id",
            'notNullData', "q"."notNullData"
          ) END "testCollection3"
        FROM "TestCollection4" "t"
        LEFT JOIN "Users" "currentUser" ON "currentUser"."_id" = $1
        LEFT JOIN "TestCollection3" "q" ON "q"."_id" = "t"."testCollection3Id"
        WHERE "_id" =  $2
      `,
      expectedArgs: ["test-user-id", "test-document-id"],
    },
  ]);
});
