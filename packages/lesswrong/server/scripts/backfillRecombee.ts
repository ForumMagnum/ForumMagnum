import ReadStatuses from "../../lib/collections/readStatus/collection";
import { Votes } from "../../lib/collections/votes";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import Users from "../../lib/vulcan-users";
import { getRecombeeClientOrThrow, recombeeRequestHelpers } from "../recombee/client";
import { Globals } from "../vulcan-lib";
import chunk from "lodash/chunk";

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

function getUserBatch(offsetDate: Date) {
  const offsetSelector = offsetDate ? { createdAt: { $gte: offsetDate } } : {};
  return Users.find(offsetSelector, { sort: { createdAt: 1 }, limit: 1000 }).fetch();
}

async function backfillUsers(offsetDate?: Date) {
  const db = getSqlClientOrThrow();
  const recombeeClient = getRecombeeClientOrThrow();

  if (!offsetDate) {
    ({ offsetDate } = await db.one<{ offsetDate: Date }>('SELECT MIN("createdAt") AS "offsetDate" FROM "Users"'));
  }

  let batch = await getUserBatch(offsetDate);

  try {
    while (batch.length) {
      const userIds = batch.map(user => user._id);
      const [readStatuses, votes] = await Promise.all([
        ReadStatuses.find({ userId: { $in: userIds }, postId: { $exists: true }, isRead: true }, undefined, { _id: 1, userId: 1, postId: 1, lastUpdated: 1 }).fetch(),
        Votes.find({
          userId: { $in: userIds },
          cancelled: { $ne: true },
          voteType: { $ne: 'neutral' },
          collectionName: 'Posts'
        }).fetch()
      ]);

      const nonSelfVotes = votes.filter(vote => !vote.authorIds?.includes(vote.userId));

      // eslint-disable-next-line no-console
      console.log(`Found ${readStatuses.length} read statuses and ${nonSelfVotes.length} non-self votes (${votes.length} including self-votes) for ${userIds.length} users`);

      const userRequestBatch = batch.map(recombeeRequestHelpers.createUpsertUserDetailsRequest);
      const readStatusRequestBatch = filterNonnull(readStatuses.map(recombeeRequestHelpers.createReadStatusRequest));
      const voteRequestBatch = filterNonnull(nonSelfVotes.map(recombeeRequestHelpers.createVoteRequest));

      const allRequests = [...userRequestBatch, ...readStatusRequestBatch, ...voteRequestBatch];
      for (const requestBatch of chunk(allRequests, 10000)) {
        const batchRequest = recombeeRequestHelpers.getBatchRequest(requestBatch);
        // eslint-disable-next-line no-console
        console.log(`Sending request batch of size ${requestBatch.length} to recombee`);
        await recombeeClient.send(batchRequest);
      }
  
      const nextOffsetDate: Date | undefined = getNextOffsetDate(offsetDate, batch);
      if (!nextOffsetDate) {
        return;
      }
      offsetDate = nextOffsetDate;
      batch = await getUserBatch(offsetDate);
    }  
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error when backfilling recombee with users.  Last offset date: ${offsetDate}`, { err });
  }
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
    ROW_TO_JSON(r.*) AS "contents",
    CASE WHEN COUNT(t.*) = 0
      THEN '{}'::JSONB[]
      ELSE ARRAY_AGG(JSONB_BUILD_ARRAY(t._id, t.name, t.core))
    END AS tags
  FROM selected_posts
  INNER JOIN "Posts" AS p
  USING(_id)
  JOIN "Revisions" AS r
  ON p."contents_latest" = r."_id"
  LEFT JOIN "TagRels" AS tr
  ON selected_posts._id = tr."postId"
  LEFT JOIN "Tags" AS t
  ON tr."tagId" = t._id
  GROUP BY p._id
  ORDER BY p."createdAt" ASC
`;

type BackfillPost = DbPost & {
  contents: DbRevision | null,
  tags: [tagId: string, tagName: string, core: boolean][],
}

function getPostBatch(offsetDate: Date) {
  const db = getSqlClientOrThrow();
  const limit = 1000;
  return db.any<BackfillPost>(postBatchQuery, [offsetDate, limit]);
}

async function backfillPosts(offsetDate?: Date) {
  const db = getSqlClientOrThrow();
  const recombeeClient = getRecombeeClientOrThrow();

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
        tags: tags.map(([_id, name, core]) => ({ _id, name, core }))
      }));

      const requestBatch = postsWithTags.map((postData) => recombeeRequestHelpers.createUpsertPostRequest(postData));
      const batchRequest = recombeeRequestHelpers.getBatchRequest(requestBatch);
      await recombeeClient.send(batchRequest);
  
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

Globals.backfillRecombeePosts = backfillPosts;
Globals.backfillRecombeeUsers = backfillUsers;
