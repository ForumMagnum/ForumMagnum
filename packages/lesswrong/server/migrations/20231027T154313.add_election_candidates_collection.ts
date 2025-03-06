export const acceptsSchemaHash = "5e28a08c9be1ba704a99a94dab5c4fae";
import ElectionCandidates from "@/lib//lib/collections/electionCandidates/collection";
import { createTable, dropTable } from "@/lib/server/migrations/meta/utils";
export const up = async ({ db }: MigrationContext) => {
    await createTable(db, ElectionCandidates);
};
export const down = async ({ db }: MigrationContext) => {
    await dropTable(db, ElectionCandidates);
};
