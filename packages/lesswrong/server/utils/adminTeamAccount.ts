import { adminAccountSetting } from '@/lib/instanceSettings';
import { createDisplayName } from "@/lib/collections/users/newSchema";
import { unstable_cache } from 'next/cache';
import Users from '../collections/users/collection';

let cachedAdminTeamAccount: DbUser | null = null;

const getCachedAccountByUsername = unstable_cache((username: string) => Users.findOne({ username }), undefined, { revalidate: 60 * 60 * 24 });

export const getAdminTeamAccount = async (context: ResolverContext) => {
  const adminAccountData = adminAccountSetting.get();
  if (!adminAccountData) {
    return null;
  }

  // We need this dynamic require because the jargonTerms schema actually uses `getAdminTeamAccountId` when declaring the schema.
  const { createUser } = await import("../collections/users/mutations");

  let account = cachedAdminTeamAccount ?? await getCachedAccountByUsername(adminAccountData.username);
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
  let teamAccountId: string|null = null;
  return async (context: ResolverContext) => {
    if (!teamAccountId) {
      const teamAccount = await getAdminTeamAccount(context)
      if (!teamAccount) return null;
      teamAccountId = teamAccount._id;
    }
    return teamAccountId;
  };
})();
