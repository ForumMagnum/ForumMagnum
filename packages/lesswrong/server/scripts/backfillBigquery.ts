import { writeFile } from "fs/promises";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { Globals, createAdminContext } from "../vulcan-lib";
import findByIds from "../vulcan-lib/findbyids";
import { getConfirmedCoauthorIds } from "../../lib/collections/posts/helpers";
import { executePromiseQueue } from "../../lib/utils/asyncUtils";

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
      p._id,
      p."userId",
      p."coauthorStatuses"
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
  ), authorships AS ((
    SELECT
      _id,
      "userId"
    FROM
    selected_posts
  )
  UNION ALL (
    SELECT
      _id,
      unnest("coauthorStatuses") ->> 'userId' AS "userId"
    FROM selected_posts
  ))
  SELECT
    p.*,
    CASE WHEN COUNT(t.*) = 0
      THEN '{}'::JSONB[]
      ELSE ARRAY_AGG(JSONB_BUILD_ARRAY(t._id, t.name, t.core))
    END AS tags,
    (SELECT ARRAY_AGG(COALESCE(u."displayName", u."username")) FROM "Users" AS u WHERE u._id IN (SELECT "userId" FROM authorships WHERE authorships._id = p._id)) AS authors,
    (SELECT COUNT(*) FROM "Votes" AS v WHERE v."documentId" = p._id AND v.cancelled IS NOT TRUE AND v.power > 0 AND v."userId" NOT IN (SELECT "userId" FROM authorships WHERE authorships._id = p._id)) AS "upvoteCount"
  FROM authorships
  INNER JOIN "Posts" AS p
  USING(_id)
  LEFT JOIN "TagRels" AS tr
  ON authorships._id = tr."postId"
  LEFT JOIN "Tags" AS t
  ON tr."tagId" = t._id
  GROUP BY p._id
  ORDER BY p."createdAt" ASC
`;

function getPostBatch(offsetDate: Date) {
  const db = getSqlClientOrThrow();
  const limit = 5000;
  return db.any<DbPost & { tags: [tagId: string, tagName: string, core: boolean][], authors: string[], upvoteCount: number }>(postBatchQuery, [offsetDate, limit]);
}

interface CreateBigQueryPostRecordArgs {
  post: DbPost;
  context: ResolverContext;
  tags?: {
    name: string;
    core: boolean;
  }[];
}

async function createBigQueryPostRecord({ post, context, tags }: CreateBigQueryPostRecordArgs) {
  const { Tags } = context;

  const tagIds = Object.entries(post.tagRelevance ?? {}).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]) => tagId)
  tags ??= filterNonnull(await findByIds(Tags, tagIds))
  const tagNames = filterNonnull(tags.map(tag => tag.name))
  const coreTagNames = filterNonnull(tags.filter(tag => tag.core).map(tag => tag.name))

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

interface CreateAEPostRecordArgs {
  post: DbPost;
  context: ResolverContext;
  tags?: {
    name: string;
    core: boolean;
  }[];
  authors?: string[];
  upvoteCount?: number;
}

async function createAEPostRecord({ post, context, tags, authors, upvoteCount }: CreateAEPostRecordArgs) {
  const { Tags } = context;

  const tagIds = Object.entries(post.tagRelevance ?? {}).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]) => tagId);
  tags ??= filterNonnull(await findByIds(Tags, tagIds));
  const tagNames = filterNonnull(tags.map(tag => tag.name));
  const postText = htmlToTextDefault(post.contents?.html);

  return {
    title: post.title,
    authors,
    score: post.score,
    karma: post.baseScore,
    body: postText,
    postedAt: post.postedAt,
    tags: tagNames,
    commentCount: post.commentCount,
    upvoteCount
  };
}

function createDelimitedJsonString<T>(records: T[]) {
  return records.map(record => JSON.stringify(record)).join('\n');
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

      const postsWithTags = batch.map(({ tags, authors, upvoteCount, ...post }) => ({
        post,
        tags: filterNonnull(tags.map(([_, name, core]) => ({ name, core }))),
        authors,
        upvoteCount
      }));

      // const bigQueryRecordBatch = await Promise.all(postsWithTags.map(({ post, tags, authors, upvoteCount }) => createAEPostRecord({ post, context: adminContext, tags, authors, upvoteCount })));
      // await writeFile(`aestudios/lw_posts_${offsetDate.toISOString()}.json`, JSON.stringify(bigQueryRecordBatch));
      
      const bigQueryRecordBatch = await executePromiseQueue(postsWithTags.map(({ post, tags }) => () => createBigQueryPostRecord({ post, context: adminContext, tags })), 10);
      await writeFile(`delimited_bigquery_posts_${offsetDate.toISOString()}.json`, createDelimitedJsonString(bigQueryRecordBatch));
  
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
