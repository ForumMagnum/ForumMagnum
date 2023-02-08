export const acceptsSchemaHash = "ffaf4a437b864708e0990e38ece649f1";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we created the collection, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
