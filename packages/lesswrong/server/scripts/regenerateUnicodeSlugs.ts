import { getUnusedSlugByCollectionName } from "../utils/slugUtil";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { Globals } from "../../lib/vulcan-lib/config";
import { slugify } from "@/lib/utils/slugify";

Globals.regenerateUnicodeSlugs = async () => {
  const db = getSqlClientOrThrow();
  const posts: Pick<DbPost, "_id" | "title" | "slug">[] = await db.any(`
    SELECT "_id", "title", "slug"
    FROM "Posts"
    WHERE "slug" LIKE 'unicode-%' OR "slug" = '{}'
  `);

  for (const {_id, title, slug} of posts) {
    const newSlug = slugify(title);
    if (newSlug !== "unicode" && slug !== newSlug) {
      const uniqueSlug = await getUnusedSlugByCollectionName(
        "Posts",
        newSlug,
      );
      await db.none(`
        UPDATE "Posts"
        SET "slug" = $1
        WHERE "_id" = $2
      `, [uniqueSlug, _id]);
    }
  }
}
