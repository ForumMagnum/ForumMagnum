
import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import {randomId} from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

interface DialogueCheckPostInfo extends DbDialogueCheck {
  postUserId: string,
  hasCoauthorPermission: DbPost['hasCoauthorPermission'],
  coauthorStatuses: DbPost['coauthorStatuses']
}
export default class DialogueChecksRepo extends AbstractRepo<DbDialogueCheck> {
  constructor() {
    super(DialogueChecks);
  }

  async upsertDialogueCheck(recordId: string,userId: string, targetUserId: string, checked: boolean, checkedAt: Date) {
    return this.none(`
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
    `, [recordId, userId, targetUserId, checked, checkedAt])
  }

  async getUsersDialogueChecks(userId: string): Promise<DbDialogueCheck[]> {
    return this.any(`
      SELECT 
        * 
      FROM public."DialogueChecks" WHERE "userId" = $1;
        `, [userId]
    )
  }

  async getMatchedUsers(userId: string, targetUserIds: string[]): Promise<DbDialogueCheck[]> {
    return this.any(`
      SELECT 
        * 
      FROM public."DialogueChecks" 
      WHERE "targetUserId" = $1 AND "userId" = ANY($2::text[]) AND "checked" = true;
    `, [userId, targetUserIds])
  }
}
