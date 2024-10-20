import { htmlToTextDefault } from "../../lib/htmlToText";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { Globals } from "../vulcan-lib";
import ReadStatuses from "../../lib/collections/readStatus/collection";
import { readFile, writeFile } from "fs/promises";
import groupBy from "lodash/groupBy";
import { googleVertexApi, helpers as googleVertexHelpers } from "../google-vertex/client";
import type { ReadStatusWithPostId } from "../google-vertex/types";

interface FrontpageView {
  userId: string;
  timestamp: string;
}

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
    r.* AS "contents",
    CASE WHEN COUNT(t.*) = 0
      THEN '{}'::JSONB[]
      ELSE ARRAY_AGG(JSONB_BUILD_ARRAY(t._id, t.name, t.core))
    END AS tags,
    (SELECT ARRAY_AGG(COALESCE(u."displayName", u."username")) FROM "Users" AS u WHERE u._id IN (SELECT "userId" FROM authorships WHERE authorships._id = p._id)) AS authors,
    ARRAY_AGG(DISTINCT authorships."userId") AS "authorIds",
    (SELECT COUNT(*) FROM "Votes" AS v WHERE v."documentId" = p._id AND v.cancelled IS NOT TRUE AND v.power > 0 AND v."userId" NOT IN (SELECT "userId" FROM authorships WHERE authorships._id = p._id)) AS "upvoteCount"
  FROM authorships
  INNER JOIN "Posts" AS p
  USING(_id)
  LEFT JOIN "TagRels" AS tr
  ON authorships._id = tr."postId"
  LEFT JOIN "Tags" AS t
  ON tr."tagId" = t._id
  LEFT JOIN "Revisions" AS r
  ON p."contents_latest" = r."_id"
  GROUP BY p._id
  ORDER BY p."createdAt" ASC
`;

function getPostBatch(offsetDate: Date) {
  const db = getSqlClientOrThrow();
  const limit = 5000;
  return db.any<DbPost & {
    tags: [tagId: string, tagName: string, core: boolean][],
    authors: string[],
    authorIds: string[],
    upvoteCount: number,
    contents: EditableFieldContents | null,
  }>(postBatchQuery, [offsetDate, limit]);
}

interface InViewEvent {
  userId: string;
  postId: string;
  /**
   * When generating the table with these events, we forgot to alias the MIN(timestamp) back to `timestamp`.
   */
  min: string;
}

function indexInViewEvents(inViewEvents: InViewEvent[]): Record<string, Record<string, string>> {
  const indexedInViewEvents: Record<string, Record<string, string>> = {};

  // eslint-disable-next-line no-console
  console.log(`Indexing ${inViewEvents.length} inViewEvents`);

  inViewEvents.reduce((acc, { postId, userId, min }) => {
    acc[postId] ??= {};
    acc[postId][userId] = min;
    return acc;
  }, indexedInViewEvents);

  // eslint-disable-next-line no-console
  console.log(`Indexed inViewEvents for ${Object.keys(indexedInViewEvents).length} posts`);

  return indexedInViewEvents;
}

async function backfillVertexPosts(inViewEventsFilepath: string, offsetDate?: Date) {
  const db = getSqlClientOrThrow();

  const inViewEvents: InViewEvent[] = JSON.parse((await readFile(inViewEventsFilepath)).toString());
  const indexedInViewEvents = indexInViewEvents(inViewEvents);

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

      const postsWithTags = batch.map(({ tags, authors, authorIds, upvoteCount, ...post }) => ({
        post,
        tags: filterNonnull(tags.map(([_id, name, core]) => ({ _id, name, core }))),
        authors,
        authorIds,
        upvoteCount
      }));

      if (postsWithTags.length) {
        const postIds = postsWithTags.map(({ post }) => post._id);
        const readStatusOperation = () => (ReadStatuses.find(
          { postId: { $in: postIds }, isRead: true }, 
          undefined, 
          { _id: 1, userId: 1, postId: 1, lastUpdated: 1 }
        ).fetch() as Promise<ReadStatusWithPostId[]>);
        
        const [_, readStatuses] = await Promise.all([
          googleVertexApi.importPosts(postsWithTags),
          readStatusOperation()
        ]);

        const postReadStatusMap = groupBy(readStatuses, 'postId');
        
        const viewItemEvents = readStatuses.map(readStatus => googleVertexHelpers.createViewItemEventFromReadStatus('view-item', readStatus));
        const mediaPlayEvents = readStatuses.map(readStatus => googleVertexHelpers.createViewItemEventFromReadStatus('media-play', readStatus));

        const inViewEvents = postsWithTags.map(({ post }) => {
          const postReadStatuses = postReadStatusMap[post._id] ?? [];
          const correspondingInViewEvents = postReadStatuses.filter(({ postId, userId }) => !!indexedInViewEvents[postId!]?.[userId]);
          return correspondingInViewEvents.map(({ postId, userId }) => {
            const timestamp = new Date(indexedInViewEvents[postId!][userId]);
            return { postId, userId, timestamp };
          })
        }).flat();

        const mediaCompleteEvents = inViewEvents.map(googleVertexHelpers.createMediaCompleteEvent);

        const userEvents = [...viewItemEvents, ...mediaPlayEvents, ...mediaCompleteEvents];

        await googleVertexApi.importUserEvents(userEvents);
      }

      const nextOffsetDate: Date | undefined = getNextOffsetDate(offsetDate, batch);
      if (!nextOffsetDate) {
        return;
      }
      offsetDate = nextOffsetDate;
      batch = await getPostBatch(offsetDate);
    }  
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error when backfilling Google Vertex with posts.  Last offset date: ${offsetDate.toISOString()}`, { err });
  }
}

async function backfillFrontpageViews(frontpageLoadsFilepath: string) {
  const frontpageViewEvents: FrontpageView[] = JSON.parse((await readFile(frontpageLoadsFilepath)).toString());
  const frontpageViewEventsWithDates = frontpageViewEvents.map(event => ({ ...event, timestamp: new Date(event.timestamp) }));
  const userHomePageEvents = frontpageViewEventsWithDates.map((event) => googleVertexHelpers.createViewHomePageEvent(event));
  await googleVertexApi.importUserEvents(userHomePageEvents);
}

Globals.backfillVertexPosts = backfillVertexPosts;
Globals.backfillVertexFrontpageViews = backfillFrontpageViews;
