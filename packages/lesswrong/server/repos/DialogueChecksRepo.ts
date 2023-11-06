
import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import {randomId} from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

export default class DialogueChecksRepo extends AbstractRepo<DbDialogueCheck> {
  constructor() {
    super(DialogueChecks);
  }

  async upsertDialogueCheck(userId: string, targetUserId: string, checked: boolean) {
    const checkedAt = new Date() // now
    return this.one(`
      INSERT INTO "DialogueChecks" (
        "_id",
        "userId",
        "targetUserId",
        "checked",
        "checkedAt"
      ) VALUES (
        $1, $2, $3, $4, $5
      ) ON CONFLICT ("userId", "targetUserId") DO UPDATE SET 
        "checked" = $4,
        "checkedAt" = $5
      RETURNING *
    `, [randomId(), userId, targetUserId, checked, checkedAt])
  }

  async checkForMatch(userId1: string, userId2: string): Promise<DbDialogueCheck[]> {
    return this.any(`
      SELECT 
        * 
      FROM "DialogueChecks" 
      WHERE "targetUserId" = $1 
      AND "userId" = $2 
      AND "checked" = true
      AND EXISTS (
        SELECT 1 
        FROM "DialogueChecks" 
        WHERE "targetUserId" = $2 
        AND "userId" = $1 
        AND "checked" = true
      );
    `, [userId1, userId2])
  }
}
