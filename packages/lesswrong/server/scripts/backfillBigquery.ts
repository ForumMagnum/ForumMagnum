import { readFile, writeFile } from "fs/promises";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { Globals, createAdminContext } from "../vulcan-lib";
import findByIds from "../vulcan-lib/findbyids";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { DocumentServiceClient, UserEventServiceClient, protos } from "@google-cloud/discoveryengine";
import groupBy from "lodash/groupBy";
import ReadStatuses from "../../lib/collections/readStatus/collection";
import chunk from "lodash/chunk";

const GOOGLE_PARENT_DOCUMENTS_PATH = 'projects/lesswrong-recommendations/locations/global/dataStores/datastore-lw-recommendations3_1713386634021/branches/default_branch';
const GOOGLE_PARENT_EVENTS_PATH = 'projects/lesswrong-recommendations/locations/global/dataStores/datastore-lw-recommendations3_1713386634021';

export const getGoogleDocumentServiceClientOrThrow = (() => {
  let client: DocumentServiceClient;

  return () => {
    if (!client) {
      client = new DocumentServiceClient();
    }

    return client;
  };
})();


export const getGoogleUserEventServiceClientOrThrow = (() => {
  let client: UserEventServiceClient;

  return () => {
    if (!client) {
      client = new UserEventServiceClient();
    }

    return client;
  };
})();

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
    ARRAY_AGG(DISTINCT authorships."userId") AS "authorIds",
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
  const limit = 100;
  return db.any<DbPost & { tags: [tagId: string, tagName: string, core: boolean][], authors: string[], authorIds: string[], upvoteCount: number }>(postBatchQuery, [offsetDate, limit]);
}

interface CreateBigQueryPostRecordArgs {
  post: DbPost;
  context: ResolverContext;
  tags?: {
    _id: string;
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
    _id: string;
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

type GoogleMediaPersonOrgRole = 'director' | 'actor' | 'player' | 'team' | 'league' | 'editor' | 'author' | 'character' | 'contributor' | 'creator' | 'editor' | 'funder' | 'producer' | 'provider' | 'publisher' | 'sponsor' | 'translator' | 'music-by' | 'channel' | 'custom-role';

interface GoogleMediaDocumentMetadata {
  title: string;
  categories: string[];
  uri: string;
  description?: string;
  /**
   * For document recommendation, this field is ignored and the text language is detected automatically.
   * The document can include text in different languages, but duplicating documents to provide text in multiple languages can result in degraded performance.
   */
  language_code?: string;
  images?: Array<{
    uri?: string;
    name?: string;
  }>;
  duration?: string;
  /**
   * The time that the content is available to the end-users. This field identifies the freshness of a content for end-users. The timestamp should conform to RFC 3339 standard.
   */
  available_time: string;
  expire_time?: string;
  media_type?: 'episode' | 'movie' | 'concert' | 'event' | 'live-event' | 'broadcast' | 'tv-series' | 'video-game' | 'clip' | 'vlog' | 'audio' | 'audio-book' | 'music' | 'album' | 'articles' | 'news' | 'radio' | 'podcast' | 'book' | 'sports-game';
  in_languages?: string[];
  country_of_origin?: string;
  filter_tags?: string[];
  hash_tags?: string[];
  content_rating?: string[];
  persons?: Array<{
    name: string;
    role: GoogleMediaPersonOrgRole;
    custom_role?: string;
    rank?: number;
    uri?: string;
  }>;
  organizations?: Array<{
    name: string;
    role: GoogleMediaPersonOrgRole;
    custom_role?: string;
    /**
     * Is this really a string?  That's what their JSON schema says, but it's an int for `persons`...
     */
    rank?: string;
    uri?: string;
  }>;
  aggregate_ratings?: Array<{
    rating_source: string;
    rating_score?: number;
    rating_count?: number;
  }>
}

interface CreateGoogleMediaDocumentMetadataArgs {
  post: DbPost;
  tags?: {
    _id: string;
    name: string;
    core: boolean;
  }[];
  authorIds?: string[];
}

function createGoogleMediaDocumentJson({ post, tags, authorIds }: CreateGoogleMediaDocumentMetadataArgs): protos.google.cloud.discoveryengine.v1.IDocument {
  const tagIds = tags?.map(tag => tag._id) ?? [];
  if (tagIds.length === 0) {
    tagIds.push('none')
  }
  const persons = authorIds?.map(authorId => ({ name: authorId, role: 'author' } as const));

  const metadata: GoogleMediaDocumentMetadata = {
    title: post.title,
    uri: `https://www.lesswrong.com${postGetPageUrl(post)}`,
    available_time: post.postedAt.toISOString(),
    categories: tagIds,
    filter_tags: tagIds,
    persons,
    media_type: 'articles',
  };

  return {
    id: post._id,
    schemaId: 'default_schema',
    jsonData: JSON.stringify(metadata),
  };
}

interface InViewEvent {
  userId: string;
  postId: string;
  /**
   * When generating the table with these events, we forgot to alias the MIN(timestamp) back to `timestamp`.
   */
  min: string;
}

function createGoogleViewItemEvent(eventType: 'view-item'|'media-play', readStatus: DbReadStatus): protos.google.cloud.discoveryengine.v1.IUserEvent {
  const { userId, postId, lastUpdated: timestamp } = readStatus;

  return {
    eventType,
    // TODO - this should be clientId if doing real stuff with it
    userPseudoId: userId, 
    eventTime: {
      seconds: timestamp.getTime() / 1000,
      nanos: 0
    },
    userInfo: { userId },
    documents: [ { id: postId } ],
  };
}

function createGoogleMediaCompleteEvent(inViewEvent: InViewEvent): protos.google.cloud.discoveryengine.v1.IUserEvent {
  const { userId, postId, min } = inViewEvent;

  return {
    eventType: 'media-complete',
    // TODO - this should be clientId if doing real stuff with it
    userPseudoId: userId, 
    eventTime: {
      seconds: new Date(min).getTime() / 1000,
      nanos: 0
    },
    userInfo: { userId },
    documents: [ { id: postId } ],
    mediaInfo: {
      mediaProgressPercentage: 1
    }
  };
}

function createDelimitedJsonString<T>(records: T[]) {
  return records.map(record => JSON.stringify(record)).join('\n');
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

function createViewHomePageEvent({userId, timestamp}: { userId: string, timestamp: string }) {
  return {
    eventType: 'view-home-page',
    userPseudoId: userId,
    eventTime: {
      seconds: new Date(timestamp).getTime() / 1000,
      nanos: 0
    },
    userInfo: { userId }
  };
}

async function backfillPosts(offsetDate?: Date) {
  const adminContext = createAdminContext();
  const db = getSqlClientOrThrow();
  const documentClient = getGoogleDocumentServiceClientOrThrow();
  const userEventClient = getGoogleUserEventServiceClientOrThrow();

  const inViewEvents: InViewEvent[] = JSON.parse((await readFile('/Users/robert/Documents/repos/ForumMagnum/in_view_events_for_google_20240415.json')).toString());
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

      const googleMediaDocuments = postsWithTags.map(createGoogleMediaDocumentJson);
      if (googleMediaDocuments.length) {
        const postIds = postsWithTags.map(({ post }) => post._id);
        const readStatusOperation = () => ReadStatuses.find(
          { postId: { $in: postIds }, isRead: true }, 
          undefined, 
          { _id: 1, userId: 1, postId: 1, lastUpdated: 1 }
        ).fetch();
        
        const [importDocumentsOperation] = await documentClient.importDocuments({ inlineSource: { documents: googleMediaDocuments }, parent: GOOGLE_PARENT_DOCUMENTS_PATH });
        const [[importDocumentsResponse], readStatuses] = await Promise.all([
          importDocumentsOperation.promise(),
          readStatusOperation()
        ]);

        if (importDocumentsResponse.errorSamples?.length) {
          // eslint-disable-next-line no-console
          console.log('Error importing documents', { error: importDocumentsResponse.errorSamples[0] });
        }

        const postReadStatusMap = groupBy(readStatuses, 'postId');
        
        const viewItemEvents = readStatuses.map(readStatus => createGoogleViewItemEvent('view-item', readStatus));
        const mediaPlayEvents = readStatuses.map(readStatus => createGoogleViewItemEvent('media-play', readStatus));

        const inViewEvents = postsWithTags.map(({ post }) => {
          const postReadStatuses = postReadStatusMap[post._id] ?? [];
          const correspondingInViewEvents = postReadStatuses.filter(({ postId, userId }) => !!indexedInViewEvents[postId!]?.[userId]);
          return correspondingInViewEvents.map(({ postId, userId }) => {
            const min = indexedInViewEvents[postId!][userId];
            return { postId, userId, min };
          })
        }).flat();

        const mediaCompleteEvents = inViewEvents.map(createGoogleMediaCompleteEvent);

        const userEvents = [...viewItemEvents, ...mediaPlayEvents, ...mediaCompleteEvents];

        const chunkedUserEvents = chunk(userEvents, 90000);
        for (const chunk of chunkedUserEvents) {
          const [importUserEventsOperation] = await userEventClient.importUserEvents({ inlineSource: { userEvents: chunk }, parent: GOOGLE_PARENT_EVENTS_PATH });
          const [importUserEventsResponse] = await importUserEventsOperation.promise();
          if (importUserEventsResponse.errorSamples?.length) {
            // eslint-disable-next-line no-console
            console.log('Error importing user events', { error: importUserEventsResponse.errorSamples[0] });
          }
        }
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
    console.log(`Error when backfilling BigQuery/Google with posts.  Last offset date: ${offsetDate.toISOString()}`, { err });
  }
}

interface FrontpageView {
  userId: string;
  timestamp: string;
}

async function backfillFrontpageViews(offsetDate?: Date) {
  const userEventClient = getGoogleUserEventServiceClientOrThrow();

  const frontpageViewEvensts: FrontpageView[] = JSON.parse((await readFile('/Users/rbloom/git/lesswrongSuite/logged_in_user_frontpage_loads_20240416.json')).toString());

  const chunkedFrontpageViews = chunk(frontpageViewEvensts, 90000);

  for (const chunk of chunkedFrontpageViews) {
    // eslint-disable-next-line no-console
    console.log(`Processing chunk of ${chunk.length} frontpage views`);
    const userEvents = chunk.map(({ userId, timestamp }) => createViewHomePageEvent({ userId, timestamp }));
    const [importUserEventsOperation] = await userEventClient.importUserEvents({ inlineSource: { userEvents }, parent: GOOGLE_PARENT_EVENTS_PATH });
    const [importUserEventsResponse] = await importUserEventsOperation.promise();
    if (importUserEventsResponse.errorSamples?.length) {
      // eslint-disable-next-line no-console
      console.log('Error importing frontpage loads', { error: importUserEventsResponse.errorSamples[0] });
    }
  }
}


Globals.backfillBigQueryPosts = backfillPosts;
Globals.backfillFrontpageViews = backfillFrontpageViews;
