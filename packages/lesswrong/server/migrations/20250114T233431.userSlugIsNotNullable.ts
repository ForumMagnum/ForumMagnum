import { Users } from "@/server/collections/users/collection";
import { getUnusedSlugByCollectionName } from "../utils/slugUtil";
import { updateMutator } from "../vulcan-lib/mutators";
import { createDisplayName } from "@/lib/collections/users/schema";
import { createAdminContext } from "../vulcan-lib/query";

export const up = async ({db}: MigrationContext) => {
  // Find and fix any users with null slugs. Theoretically there shouldn't be
  // any, but LW had 4 (all dating back to imports or buggy past versions in
  // 2017).
  const usersWithNullSlugs = await Users.find({slug: null}).fetch();
  const resolverContext = createAdminContext();

  for (const user of usersWithNullSlugs) {
    const newSlug = await getUnusedSlugByCollectionName("Users", createDisplayName(user), true, user._id);
    await updateMutator({
      collection: Users,
      documentId: user._id,
      data: {
        slug: newSlug,
      },
      context: resolverContext,
      currentUser: resolverContext.currentUser,
    });
  }
  
  await db.none(`
    ALTER TABLE "Users"
    ALTER COLUMN "slug" DROP NOT NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
}
