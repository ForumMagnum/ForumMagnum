export const acceptsSchemaHash = "4c017185479932e0f5407a2b8337f963";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we created the collection, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
