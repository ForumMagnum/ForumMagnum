import { registerMigration } from "./migrationUtils";
import { DialogueChecksRepo } from "../repos";
import { createAdminContext } from "../vulcan-lib";
import { createNotification } from "../notificationCallbacksHelpers";

registerMigration({
  name: "sendYourTurnNotifications",
  dateWritten: "2023-12-22",
  idempotent: true,
  action: async () => {
    const context = createAdminContext();
    const checksYourTurn = await new DialogueChecksRepo().getMatchFormYourTurn()
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
