import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { Globals, Utils, slugify } from "../vulcan-lib";

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
      const uniqueSlug = await Utils.getUnusedSlugByCollectionName(
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
