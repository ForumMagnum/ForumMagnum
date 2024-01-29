/**
 * Generated on 2024-01-27T04:54:52.424Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/schema/accepted_schema.sql b/schema/schema_to_accept.sql
 * index e1243ca570..bcd2bd83c4 100644
 * --- a/schema/accepted_schema.sql
 * +++ b/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: bf5c33d1f46ea5444810c9f48d5a39f0
 * -
 * --- Accepted on 2024-01-26T23:32:18.000Z by 20240126T233218.add_manifoldMarketFieldsPosts.ts
 * +-- Overall schema hash: ac7e693c0bf355ca12c2eb99772f93f5
 *  
 * @@ -498,2 +496,15 @@ CREATE TABLE "Localgroups" (
 *  
 * +-- Schema for "ManifoldProbabilitiesCaches", hash: 0b639089fbfb43a8e5d6b1bb8a7366af
 * +CREATE UNLOGGED TABLE "ManifoldProbabilitiesC aches" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "marketId" text NOT NULL,
 * +    "probability" double precision NOT NULL,
 * +    "isResolved" bool NOT NULL,
 * +    "year" double precision NOT NULL,
 * +    "lastUpdated" timestamptz NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Messages", hash: 272735d2d8d946c22c6c5d573731f84c
 * 
 * -------------------------------------------
 */
export const acceptsSchemaHash = "ac7e693c0bf355ca12c2eb99772f93f5";

import ManifoldProbabilitiesCaches from "../../lib/collections/manifoldProbabilitiesCaches/collection";
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ManifoldProbabilitiesCaches)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ManifoldProbabilitiesCaches)
}
