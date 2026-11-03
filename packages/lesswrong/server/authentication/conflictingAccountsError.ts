import { userFindOneByEmail } from '../commonQueries';

/**
 * Thrown during OAuth login when the login can't be completed because of
 * metadata (eg an email address) that's shared between multiple user accounts
 * in a way that makes it ambiguous which account to log into. Resolving this
 * requires a human to look at the accounts, so the user is told to contact
 * support.
 */
export class ConflictingAccountsError extends Error {}

/**
 * Whether a user other than `userId` has `email`. Used before syncing an
 * OAuth-provided email onto an account, since that update would otherwise fail
 * with an email-already-taken error.
 */
export async function otherUserHasEmail(email: string, userId: string): Promise<boolean> {
  const userWithSameEmail = await userFindOneByEmail(email);
  return !!userWithSameEmail && userWithSameEmail._id !== userId;
}

export interface OAuthLoginResult {
  user: DbUser
  /**
   * True if the login went through, but we found another account that
   * conflicts with this one (eg it already has the email address the OAuth
   * provider gave us, so we couldn't sync it). The user should be warned and
   * told to contact support.
   */
  conflictingAccounts: boolean
}
