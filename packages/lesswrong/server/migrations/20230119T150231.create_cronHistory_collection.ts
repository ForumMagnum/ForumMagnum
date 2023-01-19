export const acceptsSchemaHash = "c7b9d9a9376057f062950eef371f4c5a";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we created the collection, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
