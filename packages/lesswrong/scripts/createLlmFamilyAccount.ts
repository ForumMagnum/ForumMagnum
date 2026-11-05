import { getLlmFamilyBySlug } from "@/lib/languageModels/llmRegistry";
import { createUser } from "@/server/collections/users/mutations";
import { getAdminTeamAccount } from "@/server/utils/adminTeamAccount";
import { getUnusedSlugByCollectionName } from "@/server/utils/slugUtil";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";

export async function createLlmFamilyAccount(accountSlug: string) {
  const family = getLlmFamilyBySlug(accountSlug);
  if (!family) {
    throw new Error(`No model family has the slug ${accountSlug}`);
  }
  if (await getUnusedSlugByCollectionName("Users", accountSlug, true) !== accountSlug) {
    throw new Error(`The slug ${accountSlug} is already taken; co-opt that account manually`);
  }
  const context = createAdminContext();
  const adminTeamAccount = await getAdminTeamAccount(context);
  if (!adminTeamAccount) {
    throw new Error("Couldn't find the admin team account");
  }

  const account = await createUser({
    data: {
      username: family.accountSlug,
      displayName: family.name,
      slug: family.accountSlug,
      reviewedByUserId: adminTeamAccount._id,
      reviewedAt: new Date(),
    },
  }, context);
  // eslint-disable-next-line no-console
  console.log(`${family.name}: created account (/users/${account.slug})`);
}
