import { adminAccountSetting } from '@/lib/instanceSettings';
import { createDisplayName } from "@/lib/collections/users/newSchema";

let cachedAdminTeamAccount: DbUser | null = null;

export const getAdminTeamAccount = async (context: ResolverContext) => {
  const adminAccountData = adminAccountSetting.get(context);
  if (!adminAccountData) {
    return null;
  }

  // We need this dynamic require because the jargonTerms schema actually uses `getAdminTeamAccountId` when declaring the schema.
  const { createUser } = await import("../collections/users/mutations");

  let account = cachedAdminTeamAccount?._id === adminAccountData._id
    ? cachedAdminTeamAccount
    : await context.Users.findOne({ _id: adminAccountData._id });
  if (!account) {
    const newAccount = await createUser({
      data: {
        ...adminAccountData,
        displayName: createDisplayName(adminAccountData)
      },
    }, context);

    cachedAdminTeamAccount = newAccount;
    return newAccount;
  }

  cachedAdminTeamAccount = account;
  return account;
}

export const getAdminTeamAccountId = (() => {
  // Store the promise if it doesn't exist, rather than the accountId directly, to avoid hammering the db
  // on e.g. new deployments, since we fire this off once for every single jargon term on a post at the same time
  let teamAccountIdPromise: Promise<string|null>|null = null;
  return async (context: ResolverContext) => {
    if (!teamAccountIdPromise) {
      teamAccountIdPromise = getAdminTeamAccount(context).then(teamAccount => teamAccount?._id ?? null);
    }
    return teamAccountIdPromise;
  };
})();
