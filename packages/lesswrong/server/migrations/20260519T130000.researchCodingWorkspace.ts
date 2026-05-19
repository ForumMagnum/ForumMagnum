import UserSecrets from "../collections/userSecrets/collection";
import WorkspaceRepos from "../collections/workspaceRepos/collection";
import RepoInstallSnapshots from "../collections/repoInstallSnapshots/collection";
import SandboxBaselineSnapshots from "../collections/sandboxBaselineSnapshots/collection";
import { queueMigrationTask } from "./meta/migrationTaskQueue";
import { addField, createTable, dropField, updateCustomIndexes } from "./meta/utils";

export const up = async ({ db, dbOutsideTransaction }: MigrationContext) => {
  await createTable(db, UserSecrets);
  await createTable(db, WorkspaceRepos);
  await createTable(db, RepoInstallSnapshots);
  await createTable(db, SandboxBaselineSnapshots);

  queueMigrationTask(() => updateCustomIndexes(dbOutsideTransaction));

  await dropField(db, "ResearchProjects", "claudeCodeTokenRef");

  await addField(db, "ResearchConversations", "workspaceRepoId");
  await addField(db, "ResearchProjects", "defaultWorkspaceRepoId");
  await addField(db, "ResearchSandboxSessions", "devProxySecret");

  // Flatten the entrypoint union: add the two typed columns, backfill from the
  // JSONB (every conversation to date is a `chat` or `document` entrypoint,
  // both of which carry a document id), enforce NOT NULL, then drop the JSONB.
  await db.none(`ALTER TABLE "ResearchConversations" ADD COLUMN IF NOT EXISTS "entrypointKind" TEXT`);
  await db.none(`ALTER TABLE "ResearchConversations" ADD COLUMN IF NOT EXISTS "entrypointDocumentId" VARCHAR(27)`);
  await db.none(`
    UPDATE "ResearchConversations"
    SET "entrypointKind" = "entrypoint"->>'kind',
        "entrypointDocumentId" = COALESCE("entrypoint"->>'documentId', "entrypoint"->>'activeDocumentId')
    WHERE "entrypointKind" IS NULL
  `);
  await db.none(`ALTER TABLE "ResearchConversations" ALTER COLUMN "entrypointKind" SET NOT NULL`);
  await db.none(`ALTER TABLE "ResearchConversations" ALTER COLUMN "entrypointDocumentId" SET NOT NULL`);
  await dropField(db, "ResearchConversations", "entrypoint");
};
