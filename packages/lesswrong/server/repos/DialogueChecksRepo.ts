import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import {randomId} from "../../lib/random";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

const BASE_UPSERT_QUERY = `
    INSERT INTO "DialogueChecks" (
      "_id",
      "userId",
      "targetUserId",
      "checked",
      "checkedAt",
      "hideInRecommendations"
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    ) ON CONFLICT ("userId", "targetUserId")`;

interface DialogueCheckWithExtraData extends DbDialogueCheck {
  targetUserMatchPreferenceId: string;
}
class DialogueChecksRepo extends AbstractRepo<"DialogueChecks"> {
  constructor() {
    super(DialogueChecks);
  }
  async upsertDialogueCheck(userId: string, targetUserId: string, checked: boolean) {
    const checkedAt = new Date() // now
    return this.one(`
      -- DialogueChecksRepo.upsertDialogueCheck
      ${BASE_UPSERT_QUERY} DO UPDATE SET 
        "checked" = $4,
        "checkedAt" = $5
      RETURNING *
    `, [randomId(), userId, targetUserId, checked, checkedAt, false])
  }

  async upsertDialogueHideInRecommendations(userId: string, targetUserId: string, hideInRecommendations: boolean) {
    const checkedAt = new Date() // now
    return this.one(`
      -- DialogueChecksRepo.upsertDialogueHideInRecommendations
      ${BASE_UPSERT_QUERY} DO UPDATE SET 
        "hideInRecommendations" = $6
      RETURNING *
    `, [randomId(), userId, targetUserId, false, checkedAt, hideInRecommendations])
  }

  async checkForMatch(userId1: string, userId2: string): Promise<DbDialogueCheck | null> {
    return this.oneOrNone(`
      -- DialogueChecksRepo.checkForMatch
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

  async getMatchFormYourTurn(): Promise<DialogueCheckWithExtraData[]> {
    const result = await this.getRawDb().any(`
      SELECT 
        dc.*,
        dmp_reciprocal._id AS "targetUserMatchPreferenceId"
      FROM "DialogueChecks" AS dc
      LEFT JOIN "DialogueMatchPreferences" AS dmp ON dc._id = dmp."dialogueCheckId"
      LEFT JOIN "DialogueChecks" AS dc_reciprocal ON dc."userId" = dc_reciprocal."targetUserId" AND dc."targetUserId" = dc_reciprocal."userId"
      LEFT JOIN "DialogueMatchPreferences" AS dmp_reciprocal ON dc_reciprocal._id = dmp_reciprocal."dialogueCheckId"
      LEFT JOIN "Notifications" AS n ON n."documentId" = dmp_reciprocal._id
      WHERE 
          dc.checked IS TRUE
          AND dc_reciprocal.checked IS TRUE
          AND (dmp._id IS NULL OR dmp.deleted IS TRUE)
          AND dmp_reciprocal._id IS NOT NULL
          AND dmp_reciprocal.deleted IS NOT TRUE 
          AND (n._id IS NULL OR n.type != 'yourTurnMatchForm')
      GROUP BY dc._id, dmp_reciprocal._id
    `)
    return result;
  }
}

recordPerfMetrics(DialogueChecksRepo);

export default DialogueChecksRepo;
