import { getUserABTestGroup, useABTest } from "../../lib/abTestImpl";
import { newDialogueChecksNotificationABTest } from "../../lib/abTests";
import { addCronJob } from "../cronUtil";
import { createNotification } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib";

addCronJob({
  name: 'notifyUsersOfNewDialogueChecks',
  interval: 'every 1 hour',
  async job() {
    const context = createAdminContext();
    const usersWithNewChecks = await context.repos.users.getUsersWithNewDialogueChecks(60)
    usersWithNewChecks.forEach(user => {
      const notificationAbGroup = getUserABTestGroup({user}, newDialogueChecksNotificationABTest)
      if (notificationAbGroup === "control") return
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
