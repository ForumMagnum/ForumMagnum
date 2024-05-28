import { ClientIds } from "@/lib/collections/clientIds/collection";
import { updateIndexes } from "./meta/utils";

const idxName = 'idx_idx_ClientIds_clientId_unique'

/**
 * Generated on 2024-05-26T11:13:08.146Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 594df08b16..ce79da5f71 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4a1206bafcc5c4d63fca651ad906d213
 * -
 * --- Accepted on 2024-05-17T09:31:46.000Z by 20240517T093146.add_swrCachingEnabled.ts
 * +-- Overall schema hash: 6fc595baf02ccdf4ffdf8777a5981d32
 *  
 * @@ -147,6 +145,6 @@ CREATE INDEX IF NOT EXISTS "idx_CkEditorUserSessions_documentId_userId" ON "CkEd
 *  
 * --- Table "ClientIds", hash a89f7b6a0e5c393b711a60236374946f
 * +-- Table "ClientIds", hash 52ceb352c518b8e9455bcdecfe364934
 *  CREATE TABLE "ClientIds" (
 *    _id VARCHAR(27) PRIMARY KEY,
 * -  "clientId" TEXT,
 * +  "clientId" TEXT NOT NULL,
 *    "firstSeenReferrer" TEXT,
 * @@ -162,4 +160,4 @@ CREATE INDEX IF NOT EXISTS "idx_ClientIds_schemaVersion" ON "ClientIds" USING bt
 *  
 * --- Index "idx_idx_ClientIds_clientId_unique", hash 389ac27d96044b184a2dffeec7def19f
 * -CREATE UNIQUE INDEX IF NOT EXISTS "idx_idx_ClientIds_clientId_unique" ON "ClientIds" USING btree (COALESCE("clientId", ''));
 * +-- Index "idx_idx_ClientIds_clientId_unique", hash 7fc6324638598aa69cc3dca1f358ce62
 * +CREATE UNIQUE INDEX IF NOT EXISTS "idx_idx_ClientIds_clientId_unique" ON "ClientIds" USING btree ("clientId");
 *  
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "6fc595baf02ccdf4ffdf8777a5981d32";

export const up = async ({db}: MigrationContext) => {
  // The changes below are actually made in packages/lesswrong/server/manualMigrations/2024-05-26-setNotNullClientIds.ts
  // to avoid locking the table:
  //
  // await db.none(`ALTER TABLE "ClientIds" ALTER COLUMN "clientId" SET NOT NULL;`)
  // await updateIndexes(ClientIds)

  // Assert the manual migration has been run
  const clientIdsNotNull = await db.oneOrNone(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'ClientIds' AND column_name = 'clientId' AND is_nullable = 'NO'
  `) !== null;

  const indexQuery = await db.oneOrNone(`
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'ClientIds' AND indexname = '${idxName}'
  `)
  const indexIsCorrect = indexQuery?.indexdef === `CREATE UNIQUE INDEX "${idxName}" ON public."ClientIds" USING btree ("clientId")`;

  if (!clientIdsNotNull || !indexIsCorrect) {
    const notNullMessage = !clientIdsNotNull ? "'clientId' is missing NOT NULL constraint, " : "";
    const indexMessage = !indexIsCorrect ? `'${idxName}' has not been created correctly, ` : "";
    const cta = "run \"./scripts/serverShellCommand.sh 'Globals.migrations.setNotNullClientIds()'\" to fix.";
    throw new Error(notNullMessage + indexMessage + cta);
  }
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "ClientIds" ALTER COLUMN "clientId" DROP NOT NULL;`)
}
