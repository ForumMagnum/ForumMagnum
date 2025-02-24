import { registerMigration } from "./migrationUtils";
import { createAdminContext } from "../vulcan-lib/query";
import { createNotification } from "../notificationCallbacksHelpers";
import { getSqlClientOrThrow } from "../../server/sql/sqlClient";

interface DialogueCheckWithExtraData extends DbDialogueCheck {
  targetUserMatchPreferenceId: string;
}

const getMatchFormYourTurn = async (): Promise<DialogueCheckWithExtraData[]> => {
  const db = getSqlClientOrThrow();
  const sql =`
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
  `
  const result = await db.any(sql);
  return result
}

export default registerMigration({
  name: "sendYourTurnNotifications",
  dateWritten: "2023-12-22",
  idempotent: true,
  action: async () => {
    const context = createAdminContext();
    const checksYourTurn = await getMatchFormYourTurn()
    checksYourTurn.forEach(check => {
      void createNotification({
        userId: check.userId,
        notificationType: 'yourTurnMatchForm',
        documentType: 'dialogueMatchPreference',
        documentId: check.targetUserMatchPreferenceId,
        context,
        extraData: {checkId: check._id}
      });
    })
  }
})
