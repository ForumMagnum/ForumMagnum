import ReadStatuses from "../../lib/collections/readStatus/collection";
import { Votes } from "../../lib/collections/votes";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import Users from "../../lib/vulcan-users";
import { getRecombeeClientOrThrow, recombeeRequestHelpers } from "../recombee/client";
import { createAdminContext } from "../vulcan-lib";
import chunk from "lodash/chunk";

function getUserBatch(offsetDate: Date) {
  const offsetSelector = offsetDate ? { createdAt: { $gte: offsetDate } } : {};
  return Users.find(offsetSelector, { sort: { createdAt: 1 }, limit: 1000 }).fetch();
}

async function backfillUsers(offsetDate?: Date) {
  const adminContext = createAdminContext();
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
        ReadStatuses.find({ userId: { $in: userIds }, isRead: true }).fetch(),
        Votes.find({
          userId: { $in: userIds },
          cancelled: { $ne: true },
          voteType: { $ne: 'neutral' },
          collectionName: 'Posts'
        }).fetch()
      ]);

      const nonSelfVotes = votes.filter(vote => !vote.authorIds?.includes(vote.userId));

      const userRequestBatch = batch.map(recombeeRequestHelpers.createUpsertUserDetailsRequest);
      const readStatusRequestBatch = filterNonnull(readStatuses.map(recombeeRequestHelpers.createReadStatusRequest));
      const voteRequestBatch = filterNonnull(nonSelfVotes.map(recombeeRequestHelpers.createVoteRequest));

      const allRequests = [...userRequestBatch, ...readStatusRequestBatch, ...voteRequestBatch];
      for (const requestBatch of chunk(allRequests, 10000)) {
        const batchRequest = recombeeRequestHelpers.getBatchRequest(requestBatch);
        await recombeeClient.send(batchRequest);  
      }
  
      offsetDate = batch.slice(-1)[0].createdAt;
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
      p.*
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
      AND p."postedAt" >= $1
    ORDER BY p."postedAt" ASC
    LIMIT $2
  )
  SELECT
    p.*,
    ARRAY_AGG((t._id, t.name, t.core)) AS tags
  FROM selected_posts
  LEFT JOIN "TagRels" AS tr
  ON selected_posts._id = tr."postId"
  INNER JOIN "Tags" AS t
  ON tr."tagId" = t._id
`;

function getPostBatch(offsetDate: Date) {
  const db = getSqlClientOrThrow();
  const limit = 1000;
  return db.any<DbPost & { tags: [tagId: string, tagName: string, core: boolean][] }>(postBatchQuery, [offsetDate, limit]);
}

async function backfillPosts(offsetDate?: Date) {
  const adminContext = createAdminContext();
  const db = getSqlClientOrThrow();
  const recombeeClient = getRecombeeClientOrThrow();

  if (!offsetDate) {
    ({ offsetDate } = await db.one<{ offsetDate: Date }>('SELECT MIN("postedAt") AS "offsetDate" FROM "Posts"'));
  }

  let batch = await getPostBatch(offsetDate);

  try {
    while (batch.length) {
      const postsWithTags = batch.map(({ tags, ...post }) => ({
        post,
        tags: tags.map(([_, name, core]) => ({ name, core }))
      }));

      const requestBatch = await Promise.all(postsWithTags.map(({ post, tags }) => recombeeRequestHelpers.createUpsertPostRequest(post, adminContext, tags)));
      const batchRequest = recombeeRequestHelpers.getBatchRequest(requestBatch);
      await recombeeClient.send(batchRequest);
  
      offsetDate = batch.slice(-1)[0].postedAt;
      batch = await getPostBatch(offsetDate);
    }  
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error when backfilling recombee with posts.  Last offset date: ${offsetDate}`, { err });
  }
}
