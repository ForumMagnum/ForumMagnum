/**
 * Generated on 2024-01-26T22:55:42.263Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/schema/accepted_schema.sql b/schema/schema_to_accept.sql
 * index 717d06c846..c9479d04cb 100644
 * --- a/schema/accepted_schema.sql
 * +++ b/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7dbf024fc86645c003e6ca3f42cf3af5
 * -
 * --- Accepted on 2024-01-18T10:47:51.000Z by 20240118T104751.add_PostView_PostViewTimes.ts
 * +-- Overall schema hash: 8d498c2c299a4fdf9ab47fcb9f045078
 *  
 * @@ -568,4 +566,4 @@ CREATE TABLE "Notifications" (
 *  
 * --- Schema for "PageCache", hash: df93df381ba889d98a725ab76854eac7
 * -CREATE TABLE "PageCache" (
 * +-- Schema for "PageCache", hash: e912e37a4191e1dd2ccbc2360a06acf7
 * +CREATE UNLOGGED TABLE "PageCache" (
 *      _id varchar(27) PRIMARY KEY,
 * 
 * -------------------------------------------
 */
export const acceptsSchemaHash = "8d498c2c299a4fdf9ab47fcb9f045078";

import PageCache from "../../lib/collections/pagecache/collection"
import { logTable, unlogTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await unlogTable(db, PageCache)
}

export const down = async ({db}: MigrationContext) => {
  await logTable(db, PageCache)
}
