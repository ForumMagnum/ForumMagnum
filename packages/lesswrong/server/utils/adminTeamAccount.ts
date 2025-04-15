import { adminAccountSetting } from "@/lib/publicSettings";

export const getAdminTeamAccount = async (context: ResolverContext) => {
  const { Users } = context;
  const adminAccountData = adminAccountSetting.get();
  if (!adminAccountData) {
    return null;
  }

  // We need this dynamic require because the jargonTerms schema actually uses `getAdminTeamAccountId` when declaring the schema.
  const { createUser }: typeof import("../collections/users/mutations") = require("../collections/users/mutations");

  let account = await Users.findOne({username: adminAccountData.username});
  if (!account) {
    const newAccount = await createUser({
      data: adminAccountData
    }, context);
    
    return newAccount;
  }
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
