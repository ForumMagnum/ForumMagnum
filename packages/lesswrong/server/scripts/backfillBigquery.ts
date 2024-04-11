import { writeFile } from "fs/promises";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { Globals, createAdminContext } from "../vulcan-lib";
import findByIds from "../vulcan-lib/findbyids";

function getNextOffsetDate<T extends HasCreatedAtType>(currentOffsetDate: Date, batch: T[]) {
  const nextOffsetDate = batch.slice(-1)[0].createdAt;
  if (currentOffsetDate.getTime() === nextOffsetDate.getTime()) {
    // eslint-disable-next-line no-console
    console.log(`Next batch offset date is the same as previous offset date: ${currentOffsetDate.toISOString()}.  If this seems like an early return, investigate!`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Next batch offset date: ${nextOffsetDate.toISOString()}`);

  return nextOffsetDate;
}

const postBatchQuery = `
  WITH selected_posts AS (
    SELECT
      p._id
    FROM "Posts" AS p
    WHERE p.draft IS NOT TRUE
      AND p."isFuture" IS FALSE
      AND p."unlisted" IS NOT TRUE
      AND p.rejected IS NOT TRUE
      AND p."hiddenRelatedQuestion" IS NOT TRUE
      AND p."groupId" IS NULL
      AND p.shortform IS NOT TRUE
      AND ((p."authorIsUnreviewed" IS NOT TRUE) OR (p."reviewedByUserId" IS NOT NULL))
      AND p.status = 2
      AND p."createdAt" >= $1
    ORDER BY p."createdAt" ASC
    LIMIT $2
  )
  SELECT
    p.*,
    CASE WHEN COUNT(t.*) = 0
      THEN '{}'::JSONB[]
      ELSE ARRAY_AGG(JSONB_BUILD_ARRAY(t._id, t.name, t.core))
    END AS tags
  FROM selected_posts
  INNER JOIN "Posts" AS p
  USING(_id)
  LEFT JOIN "TagRels" AS tr
  ON selected_posts._id = tr."postId"
  LEFT JOIN "Tags" AS t
  ON tr."tagId" = t._id
  GROUP BY p._id
  ORDER BY p."createdAt" ASC
`;

function getPostBatch(offsetDate: Date) {
  const db = getSqlClientOrThrow();
  const limit = 5000;
  return db.any<DbPost & { tags: [tagId: string, tagName: string, core: boolean][] }>(postBatchQuery, [offsetDate, limit]);
}

async function createBigQueryPostRecord(post: DbPost, context: ResolverContext, tags?: { name: string, core: boolean }[]) {
  const { Tags } = context;

  const tagIds = Object.entries(post.tagRelevance ?? {}).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]) => tagId)
  tags ??= filterNonnull(await findByIds(Tags, tagIds))
  const tagNames = tags.map(tag => tag.name)
  const coreTagNames = tags.filter(tag => tag.core).map(tag => tag.name)

  const postText = htmlToTextDefault(post.contents?.html)

  return {
    title: post.title,
    author: post.author,
    authorId: post.userId,
    karma: post.baseScore,
    body: postText,
    postedAt: post.postedAt,
    tags: tagNames,
    coreTags: coreTagNames,
    curated: !!post.curatedDate,
    frontpage: !!post.frontpageDate,
    draft: !!post.draft,
    lastCommentedAt: post.lastCommentedAt,
  };
}

async function backfillPosts(offsetDate?: Date) {
  const adminContext = createAdminContext();
  const db = getSqlClientOrThrow();

  if (!offsetDate) {
    ({ offsetDate } = await db.one<{ offsetDate: Date }>('SELECT MIN("createdAt") AS "offsetDate" FROM "Posts"'));
  }

  // eslint-disable-next-line no-console
  console.log(`Initial post batch offset date: ${offsetDate.toISOString()}`);

  let batch = await getPostBatch(offsetDate);

  try {
    while (batch.length) {
      // eslint-disable-next-line no-console
      console.log(`Post batch size: ${batch.length}.`);

      const postsWithTags = batch.map(({ tags, ...post }) => ({
        post,
        tags: tags.map(([_, name, core]) => ({ name, core }))
      }));

      const bigQueryRecordBatch = await Promise.all(postsWithTags.map(({ post, tags }) => createBigQueryPostRecord(post, adminContext, tags)));

      await writeFile(`bigquery_posts_${offsetDate.toISOString()}.json`, JSON.stringify(bigQueryRecordBatch));
  
      const nextOffsetDate: Date | undefined = getNextOffsetDate(offsetDate, batch);
      if (!nextOffsetDate) {
        return;
      }
      offsetDate = nextOffsetDate;
      batch = await getPostBatch(offsetDate);
    }  
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error when backfilling recombee with posts.  Last offset date: ${offsetDate.toISOString()}`, { err });
  }
}

Globals.backfillBigQueryPosts = backfillPosts;
