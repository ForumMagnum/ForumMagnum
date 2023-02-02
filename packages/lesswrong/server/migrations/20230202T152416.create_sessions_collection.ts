export const acceptsSchemaHash = "5ef454edd738e81560411f4eb688ceff";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we created the collection, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
