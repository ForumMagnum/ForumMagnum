import ResearchSandboxSessions from "../collections/researchSandboxSessions/collection";
import { createTable, dropTable } from "./meta/utils";

/**
 * Reshape `ResearchSandboxSessions` for persistent per-conversation sandboxes:
 * one row per conversation, keyed by `conversationId`, holding only the
 * per-sandbox `supervisorSecret`. The ephemeral-model columns
 * (`vercelSandboxId`, `endpointUrl`, `status`, `concurrencyCount`,
 * `lastUsedAt`, `expiresAt`, `userId`, `projectId`) are gone.
 *
 * The table only ever existed on dev, and every existing row points at a
 * long-dead ephemeral sandbox, so this drops and recreates rather than
 * altering in place. `createTable` builds the table and its indexes from the
 * collection schema. There is no `down`: the migration drops columns and data,
 * so it has no meaningful reverse.
 */
export const up = async ({ db }: MigrationContext) => {
  await dropTable(db, ResearchSandboxSessions);
  await createTable(db, ResearchSandboxSessions);
};
