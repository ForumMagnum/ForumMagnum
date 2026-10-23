import { LLM_FAMILIES } from "@/lib/languageModels/llmRegistry";
import Users from "@/server/collections/users/collection";
import { createUser } from "@/server/collections/users/mutations";
import { getAdminTeamAccount } from "@/server/utils/adminTeamAccount";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";

/**
 * Create an account for each family in LLM_FAMILIES that doesn't have one
 * yet. Accounts are marked reviewed, so their replies skip new-user
 * moderation.
 *
 * yarn repl dev lw packages/lesswrong/scripts/createLlmFamilyAccounts.ts 'createLlmFamilyAccounts()'
 */
export async function createLlmFamilyAccounts() {
  const context = createAdminContext();
  const adminTeamAccount = await getAdminTeamAccount(context);
  if (!adminTeamAccount) {
    throw new Error("Couldn't find the admin team account");
  }

  for (const family of LLM_FAMILIES) {
    const existingAccount = await Users.findOne({ llmFamily: family.name });
    if (existingAccount) {
      // eslint-disable-next-line no-console
      console.log(`${family.name}: account exists (/users/${existingAccount.slug})`);
      continue;
    }
    const account = await createUser({
      data: {
        username: family.accountSlug,
        displayName: family.name,
        // Mentions link to this slug; creation fails if it's taken
        slug: family.accountSlug,
        reviewedByUserId: adminTeamAccount._id,
        reviewedAt: new Date(),
      },
    }, context);
    // llmFamily isn't settable through the user API
    await Users.rawUpdateOne({ _id: account._id }, { $set: { llmFamily: family.name } });
    // eslint-disable-next-line no-console
    console.log(`${family.name}: created account (/users/${account.slug})`);
  }
}
