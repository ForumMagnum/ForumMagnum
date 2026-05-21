import UserSecrets from "../collections/userSecrets/collection";
import WorkspaceRepos from "../collections/workspaceRepos/collection";
import RepoInstallSnapshots from "../collections/repoInstallSnapshots/collection";
import SandboxBaselineSnapshots from "../collections/sandboxBaselineSnapshots/collection";
import { createTable } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, UserSecrets);
  await createTable(db, WorkspaceRepos);
  await createTable(db, RepoInstallSnapshots);
  await createTable(db, SandboxBaselineSnapshots);
};
