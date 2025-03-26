import { adminAccountSetting } from "@/lib/publicSettings";

export const getAdminTeamAccount = async (context: ResolverContext) => {
  const { Users } = context;
  const adminAccountData = adminAccountSetting.get();
  if (!adminAccountData) {
    return null;
  }
  let account = await Users.findOne({username: adminAccountData.username});
  if (!account) {
    const { createMutator }: { createMutator: typeof import("../vulcan-lib/mutators").createMutator } = require("../vulcan-lib/mutators");
    const newAccount = await createMutator({
      collection: Users,
      document: adminAccountData,
      validate: false,
    })
    return newAccount.data
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
