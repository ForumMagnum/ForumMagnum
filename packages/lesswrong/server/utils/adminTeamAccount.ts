import { adminAccountSetting } from "@/lib/publicSettings";

export const getAdminTeamAccount = async (context: ResolverContext) => {
  const { Users } = context;
  const adminAccountData = adminAccountSetting.get();
  if (!adminAccountData) {
    return null;
  }
  let account = await Users.findOne({username: adminAccountData.username});
  if (!account) {
    const { createUser }: typeof import("../collections/users/mutations") = require("../collections/users/mutations");
    const { createAnonymousContext }: typeof import("../vulcan-lib/createContexts") = require("../vulcan-lib/createContexts");
    // Create an anonymous context since there's no currentUser for this operation
    const anonContext = createAnonymousContext();
    
    const newAccount = await createUser({
      data: adminAccountData
    }, anonContext, true);
    
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
