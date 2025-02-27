import { adminAccountSetting } from "@/lib/publicSettings";
import { createMutator } from "../vulcan-lib/mutators";
import Users from "@/lib/collections/users/collection";

export const getAdminTeamAccount = async () => {
  const adminAccountData = adminAccountSetting.get();
  if (!adminAccountData) {
    return null;
  }
  let account = await Users.findOne({username: adminAccountData.username});
  if (!account) {
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
  return async () => {
    if (!teamAccountId) {
      const teamAccount = await getAdminTeamAccount()
      if (!teamAccount) return null;
      teamAccountId = teamAccount._id;
    }
    return teamAccountId;
  };
})();
