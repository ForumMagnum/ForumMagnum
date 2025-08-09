/* eslint-disable no-console */
import { runSqlQuery } from "../sql/sqlClient";
import { getUnusedSlugByCollectionName } from "../utils/slugUtil";
import Posts from "../collections/posts/collection";
import { slugify } from "@/lib/utils/slugify";
import { updatePost } from "../collections/posts/mutations";
import { createAnonymousContext } from "../vulcan-lib/createContexts";

export default async function fixUntitledDraftSlugs() {
  const postIdsWithUntitledDraftSlugs = (await runSqlQuery(`
    SELECT _id
    FROM "Posts"
    WHERE LOWER(title) <> LOWER('Untitled Draft')
    AND slug LIKE 'untitled-draft%'
  `)).map(row => row._id);
  
  console.log(`Found ${postIdsWithUntitledDraftSlugs.length} posts with slug untitled-draft-* with different titles`);
  for (const postId of postIdsWithUntitledDraftSlugs) {
    await regenerateSlugForPostId(postId);
  }
}

async function regenerateSlugForPostId(postId: string) {
  const post = await Posts.findOne({_id: postId});
  if (!post) throw new Error("Invalid post ID");
  const { title, slug: oldSlug } = post;
  const newSlug = await getUnusedSlugByCollectionName("Posts", slugify(title), false, post._id);
  if (oldSlug !== newSlug) {
    console.log(`Changing slug of post ${postId} from ${oldSlug} to ${newSlug}`);
    await updatePost({
      selector: { _id: postId },
      data: { slug: newSlug },
    }, createAnonymousContext());
  }
}
