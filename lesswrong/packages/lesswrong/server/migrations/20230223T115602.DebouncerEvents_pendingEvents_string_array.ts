export const acceptsSchemaHash = "c938b8b04e3c61dec2f0b640b6cb0b4d";

export const up = async (_: MigrationContext) => {
  /*
   * No change is needed here - we changed the field type, but the table
   * will be created by the `migrateCollections` script
   */
}

export const down = async (_: MigrationContext) => {}
