import Users from "@/server/collections/users/collection";
import { ACCOUNT_DELETION_COOLING_OFF_DAYS, getUserEmail } from "@/lib/collections/users/helpers";
import { getAdminTeamAccount } from "../utils/adminTeamAccount";
import { loggerConstructor } from "@/lib/utils/logging";
import md5 from "md5";
import { captureException } from "@/lib/sentryWrapper";
// import { dogstatsd } from "../datadog/tracer";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { updateUser } from "../collections/users/mutations";

type DeleteOptions = { includingNonForumData: boolean };
const defaultDeleteOptions = { includingNonForumData: false };


async function permanentlyDeleteUser(user: DbUser, options: DeleteOptions) {
  const logger = loggerConstructor(`permanentlyDeleteUsers`);
  const adminContext = createAdminContext();
  const adminTeamAccount = await getAdminTeamAccount(adminContext);
  if (!adminTeamAccount) throw new Error("Couldn't find admin team account");

  // Precaution: Ensure the soft-deleting callbacks have run (unsubscribing from mailchimp, reindexing elasticsearch content)
  await updateUser({ data: { deleted: true }, selector: { _id: user._id } }, adminContext)
  // Wait until async callbacks finish. This is overcautious, as there should be no need for the callbacks to refetch the user object
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Permanently delete from the forum itself
  await Users.rawRemove({ _id: user._id });
  logger(`Permanently deleted user with display name "${user.displayName}" from the forum database`)
}

/**
 * Permanently delete a user from the forum, this is sufficient to comply with GDPR deletion
 * requests if their forum account and associated services is the only data we have for them
 * Exported to allow running with "yarn repl"
 */
export async function permanentlyDeleteUserById(userId: string, options?: DeleteOptions) {
  const user = await Users.findOne({_id: userId})

  if (!user) {
    // eslint-disable-next-line no-console
    console.log(`User with _id "${userId}" not found`)
    return
  }

  await permanentlyDeleteUser(user, options ?? defaultDeleteOptions)
}

const cutoffOffsetMs = ACCOUNT_DELETION_COOLING_OFF_DAYS * 24 * 60 * 60 * 1000;

export async function permanentlyDeleteUsers() {
  const deletionRequestCutoff = new Date(Date.now() - cutoffOffsetMs)

  const usersToDelete = await Users.find({ permanentDeletionRequestedAt: { $lt: deletionRequestCutoff } }).fetch();

  if (usersToDelete.length > 10) {
    // dogstatsd?.increment("user_deleted", usersToDelete.length, 1.0, {outcome: 'error'})
    throw new Error("Unexpectedly high number of users queued for deletion")
  }

  for (const user of usersToDelete) {
    try {
      await permanentlyDeleteUser(user, defaultDeleteOptions)
      // dogstatsd?.increment("user_deleted", 1, 1.0, {outcome: 'success'})
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      // dogstatsd?.increment("user_deleted", 1, 1.0, {outcome: 'error'})
    }
  }
}
