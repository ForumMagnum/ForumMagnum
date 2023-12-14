import CkEditorUserSessions from "../../lib/collections/ckEditorUserSessions/collection";
import {randomId} from "../../lib/random";
import AbstractRepo from "./AbstractRepo";


export default class CkEditorUserSessionsRepo extends AbstractRepo<DbCkEditorUserSession> {
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
