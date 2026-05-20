import WorkspaceRepos from "@/server/collections/workspaceRepos/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class WorkspaceReposRepo extends AbstractRepo<"WorkspaceRepos"> {
  constructor() {
    super(WorkspaceRepos);
  }

  /**
   * Returns one row per `(host, owner, name)` for the user — the most recent
   * config revision. `WorkspaceRepos` is immutable, so a reconfigure inserts a
   * new row; clients almost always want only the current config and shouldn't
   * have to dedupe across revisions.
   */
  async getCurrentByUserId(userId: string): Promise<DbWorkspaceRepo[]> {
    return this.any(`
      -- WorkspaceReposRepo.getCurrentByUserId
      SELECT DISTINCT ON ("host", "owner", "name") *
      FROM "WorkspaceRepos"
      WHERE "userId" = $(userId)
      ORDER BY "host", "owner", "name", "createdAt" DESC
    `, { userId });
  }
}

recordPerfMetrics(WorkspaceReposRepo);

export default WorkspaceReposRepo;
