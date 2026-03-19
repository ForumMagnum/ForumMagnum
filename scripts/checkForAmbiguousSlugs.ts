/* eslint-disable no-console */
import { slugLooksLikeId } from "@/lib/utils/slugify";
import Posts from "@/server/collections/posts/collection";
import { updatePost } from "@/server/collections/posts/mutations";
import Users from "@/server/collections/users/collection";
import { forEachDocumentBatchInCollection } from "@/server/manualMigrations/migrationUtils";
import { runSqlQuery } from "@/server/sql/sqlClient";
import { getUnusedSlugByCollectionName } from "@/server/utils/slugUtil";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";

export async function checkForAmbiguousSlugs() {
  const posts = await runSqlQuery(`
    SELECT _id, slug
    FROM "Posts"
    WHERE NOT (slug LIKE '%-%')
    AND (length(slug) = 17 OR length(slug) = 24)
  `);
  const users = await runSqlQuery(`
    SELECT _id, slug
    FROM "Users"
    WHERE
      NOT (slug LIKE '%-%')
      AND (length(slug) = 17 OR length(slug) = 24)
  `);
  const tags = await runSqlQuery(`
    SELECT _id, slug
    FROM "Tags"
    WHERE
      NOT (slug LIKE '%-%')
      AND (length(slug) = 17 OR length(slug) = 24)
  `);
  const multiDocuments = await runSqlQuery(`
    SELECT _id, slug
    FROM "MultiDocuments"
    WHERE
      NOT (slug LIKE '%-%')
      AND (length(slug) = 17 OR length(slug) = 24)
  `);
  const tagFlags = await runSqlQuery(`
    SELECT _id, slug
    FROM "TagFlags"
    WHERE
      NOT (slug LIKE '%-%')
      AND (length(slug) = 17 OR length(slug) = 24)
  `);

  for (const post of posts) {
    if (slugLooksLikeId(post.slug)) {
      console.log(`Post ${post._id} has an ambiguous slug: ${post.slug}`);
    }
  }
  for (const user of users) {
    if (slugLooksLikeId(user.slug)) {
      console.log(`User ${user._id} has an ambiguous slug: ${user.slug}`);
    }
  }
  for (const tag of tags) {
    if (slugLooksLikeId(tag.slug)) {
      console.log(`Tag ${tag._id} has an ambiguous slug: ${tag.slug}`);
    }
  }
  for (const multiDocument of multiDocuments) {
    if (slugLooksLikeId(multiDocument.slug)) {
      console.log(`MultiDocument ${multiDocument._id} has an ambiguous slug: ${multiDocument.slug}`);
    }
  }
  for (const tagFlag of tagFlags) {
    if (slugLooksLikeId(tagFlag.slug)) {
      console.log(`TagFlag ${tagFlag._id} has an ambiguous slug: ${tagFlag.slug}`);
    }
  }
}

export async function reassignAmbiguousPostSlugs() {
  const posts = await runSqlQuery(`
    SELECT _id, slug, title
    FROM "Posts"
    WHERE
      (NOT (slug LIKE '%-%'))
      AND (length(slug) = 17 OR length(slug) = 24)
  `);
  for (const post of posts) {
    if (!slugLooksLikeId(post.slug)) {
      continue;
    }
    const newSlug = await getUnusedSlugByCollectionName("Posts", post.title);
    console.log(`Reassigning slug of post ${post._id} from ${post.slug} to ${newSlug}`);
    await updatePost({
      selector: { _id: post._id },
      data: { slug: newSlug },
    }, createAdminContext());
  }
}
