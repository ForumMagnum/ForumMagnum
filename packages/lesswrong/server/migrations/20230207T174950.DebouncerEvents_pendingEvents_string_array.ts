export const acceptsSchemaHash = "e99446368f7b5fd3d5f9c3b5d62ab7ed";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we changed the field type, but the table
   * will be created by the `migrateCollections` script
   */
}
