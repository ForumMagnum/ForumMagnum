import { getUserABTestGroup, useABTest } from "../../lib/abTestImpl";
import { addCronJob } from "../cronUtil";
import { createNotification } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib";

addCronJob({
  name: 'notifyUsersOfNewDialogueChecks',
  interval: 'every 1 hour',
  async job() {
    const context = createAdminContext();
    const usersWithNewChecks = await context.repos.users.getUsersWithNewDialogueChecks()
    usersWithNewChecks.forEach(user => {
      void createNotification({
        userId: user._id,
        notificationType: "newDialogueChecks",
        documentType: null,
        documentId: null,
        context,
      })
    })
  }
});
