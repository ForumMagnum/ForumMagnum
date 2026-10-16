import { userFindOneByEmail } from '../commonQueries';

/**
 * Thrown during OAuth login when the login can't be completed because of
 * metadata (eg an email address) that's shared between multiple user accounts.
 * Resolving this requires a human to look at the accounts, so the user is told
 * to contact support.
 */
export class ConflictingAccountsError extends Error {}

/**
 * Throws a ConflictingAccountsError if a user other than `userId` has `email`.
 * Used before syncing an OAuth-provided email onto an account, since that
 * update would otherwise fail with an uninformative email-already-taken error.
 */
export async function assertNoOtherUserHasEmail(email: string, userId: string) {
  const userWithSameEmail = await userFindOneByEmail(email);
  if (userWithSameEmail && userWithSameEmail._id !== userId) {
    throw new ConflictingAccountsError(`Cannot sync OAuth email ${email} to user ${userId}: user ${userWithSameEmail._id} already has that email`);
  }
}
