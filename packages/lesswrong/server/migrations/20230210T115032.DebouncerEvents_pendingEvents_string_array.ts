export const acceptsSchemaHash = "db6fd1542308531319a4ee016d060516";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we changed the field type, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
