export const acceptsSchemaHash = "2ad14f1cd0db6f2fdf93dfa328568fe5";
export const up = async (_: MigrationContext) => {
    /*
     * No change is needed here - we created the collection, but the table
     * will be created by the `migrateCollections` script
     */
};
export const down = async (_: MigrationContext) => { };
