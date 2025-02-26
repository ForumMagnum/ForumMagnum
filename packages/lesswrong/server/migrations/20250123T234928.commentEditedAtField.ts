import { Comments } from "@/lib/collections/comments/collection.ts"
import { addField, dropField } from "./meta/utils"
import { forEachBucketRangeInCollection } from "../manualMigrations/migrationUtils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, "lastEditedAt")
  
  // This migration creates the column but doesn't populate it; to populate it
  // we have a manual migration 'Globals.migrations.commentLastEditedAt()'.
  // The reason is because the commented-out version below was very slow (took
  // 27min on a local DB) and locks the table while it's running.

  /*await db.none(`
    UPDATE "Comments" c
    SET "lastEditedAt" = (
      SELECT MAX(r."editedAt")
      FROM "Revisions" r
      WHERE r."documentId" = c."_id"
      AND NOT r.draft
    )
    WHERE EXISTS (
      SELECT 1
      FROM "Revisions" r
      WHERE r."documentId" = c."_id"
      AND NOT r.draft
    );
  `);*/
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "lastEditedAt");
}
