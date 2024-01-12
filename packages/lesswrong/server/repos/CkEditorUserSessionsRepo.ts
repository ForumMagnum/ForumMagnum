import CkEditorUserSessions from "../../lib/collections/ckEditorUserSessions/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class CkEditorUserSessionsRepo extends AbstractRepo<"CkEditorUserSessions"> {
  constructor() {
    super(CkEditorUserSessions);
  }

  getActiveDialogueUserSessions(since: Date): Promise<CkEditorUserSessionInfo[]> {
    return this.getRawDb().any(`
    SELECT
      c."documentId",
      c."userId",
      c."createdAt",
      c."endedAt"
    FROM "CkEditorUserSessions" AS c
    INNER JOIN public."Posts" AS p ON p._id = c."documentId"
    WHERE
      (c."createdAt" > $1 AND c."endedAt" IS NULL)
      AND p."collabEditorDialogue" IS TRUE
    `, [since])
  }
}

recordPerfMetrics(CkEditorUserSessionsRepo);

export default CkEditorUserSessionsRepo;
