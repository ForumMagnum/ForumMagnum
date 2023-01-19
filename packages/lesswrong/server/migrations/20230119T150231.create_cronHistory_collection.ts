export const acceptsSchemaHash = "7f78055b7fe8ee2024beb99df7836f31";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we created the collection, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
