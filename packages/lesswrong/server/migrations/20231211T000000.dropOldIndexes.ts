const dropOldDatabaseMetadataIndex = 'DROP INDEX IF EXISTS "idx_DatabaseMetadata_name_old";';
  
const dropOldDebouncerEventsIndex = 'DROP INDEX IF EXISTS "idx_DebouncerEvents_dispatched_af_key_name_filtered_old";';
  
const dropOldPageCacheIndex = 'DROP INDEX IF EXISTS "idx_PageCache_path_abTestGroups_bundleHash_old";'

// Only drop the read statuses index if the old one still exists to be renamed afterwards
const dropReadStatusesIndex = `
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'i' AND c.relname = 'idx_ReadStatuses_userId_postId_tagId_old'
    ) THEN
      EXECUTE 'DROP INDEX IF EXISTS "idx_ReadStatuses_userId_postId_tagId"';
    END IF;
  END
  $$;
`;

const renameReadStatusesIndex = `
  ALTER INDEX IF EXISTS "idx_ReadStatuses_userId_postId_tagId_old"
  RENAME TO "idx_ReadStatuses_userId_postId_tagId";
`;


export const up = async ({db}: MigrationContext) => {
  await db.none(dropOldDatabaseMetadataIndex);
  await db.none(dropOldDebouncerEventsIndex);
  await db.none(dropOldPageCacheIndex);
  await db.none(dropReadStatusesIndex);
  await db.none(renameReadStatusesIndex);
}

export const down = async ({db}: MigrationContext) => {
}
