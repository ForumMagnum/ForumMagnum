import Posts from "../../server/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";
import { getViewableEventsSelector, getViewablePostsSelector } from "./helpers";
import { joinReaderUpvote, readerFollowedAuthorIds, readerSeesLessOf } from "./aiDigestSqlHelpers";
import { recordPerfMetrics } from "./perfMetricWrapper";
import type { ForumTypeString } from "../../lib/instanceSettings";
import {FilterPostsForReview} from '@/components/bookmarks/ReadHistoryTab'
import { FilterSettings, FilterMode } from "@/lib/filterSettings";
import { FeedFullPost, FeedItemSourceType } from "@/components/ultraFeed/ultraFeedTypes";
import { TIME_DECAY_FACTOR, SCORE_BIAS } from "@/lib/scoring";
import { getPgPromiseLib } from "@/server/sqlConnection";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

type DbPostWithContents = DbPost & {contents?: DbRevision | null};

type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

export interface AiDigestPostCandidateRow {
  postId: string;
  revisionId: string;
  title: string;
  author: string;
  postedAt: Date;
  baseScore: number;
  /** Karma decayed by age, as used to rank the front page; rounded, as it's only for the prompt. */
  decayedScore: number;
  tags: string[];
  curated: boolean;
  hasReadStatus: boolean;
  liked: "regular" | "strong" | null;
  followsAuthor: boolean;
}

export interface AiDigestReaderReadStats {
  total: number;
  last30Days: number;
  last180Days: number;
  /** Reads from the last 180 days, by how old the post was when it was read. */
  readsByPostAge: {
    under7Days: number;
    from7To30Days: number;
    from31To180Days: number;
    over180Days: number;
  };
}

export interface AiDigestReaderAffinityRow {
  name: string;
  reads: number;
}

export interface AiDigestReaderRecentPostRow {
  title: string;
  author: string;
  postedAt: Date;
  readAt: Date | null;
  liked: "regular" | "strong" | null;
  likedAt: Date | null;
  authoredAt: Date | null;
  commentedAt: Date | null;
}

export interface AiDigestReaderNegativePreferenceRow {
  kind: "seeLess" | "hidden";
  collectionName: "Posts" | "Comments" | "Spotlights" | null;
  title: string | null;
  author: string | null;
  topics: string[];
  feedbackAt: Date | null;
  feedbackReasons: {
    author?: boolean;
    topic?: boolean;
    contentType?: boolean;
    other?: boolean;
    text?: string;
  } | null;
}

export interface AiDigestRecentlyCuratedPostRow {
  postId: string;
  isRead: boolean;
}

export interface AiDigestPastPostOutcomeRow {
  postId: string;
  title: string;
  author: string;
  postedAt: Date;
  readAt: Date | null;
  liked: "regular" | "strong" | null;
  likedAt: Date | null;
}

/**
 * Plain-text author byline for AI digest prompts: 'Anonymous' when the post
 * hides its author, otherwise the primary author's display name followed by
 * any coauthors in order. Expects the post's author row joined as `userAlias`.
 */
const aiDigestPostAuthorExpression = (postAlias: string, userAlias: string) => `CASE
  WHEN ${postAlias}."hideAuthor" THEN 'Anonymous'
  ELSE concat_ws(
    ', ',
    COALESCE(${userAlias}."displayName", ${postAlias}.author, 'LessWrong contributor'),
    NULLIF((
      SELECT string_agg(coauthor."displayName", ', ' ORDER BY coauthor_ids.position)
      FROM unnest(${postAlias}."coauthorUserIds") WITH ORDINALITY AS coauthor_ids("userId", position)
      INNER JOIN "Users" coauthor ON coauthor."_id" = coauthor_ids."userId"
    ), '')
  )
END`;

/** Names of the post's positively-scored tags, strongest relevance first. */
const aiDigestPostTagNamesSubquery = (postIdExpression: string, limit?: number) => `ARRAY(
  SELECT COALESCE(t."shortName", t.name)
  FROM "TagRels" tr
  INNER JOIN "Tags" t ON t."_id" = tr."tagId"
  WHERE tr."postId" = ${postIdExpression}
    AND tr.deleted IS FALSE
    AND tr."baseScore" > 0
    AND t.deleted IS FALSE
  ORDER BY tr."baseScore" DESC, t."_id"${limit === undefined ? "" : `
  LIMIT ${limit}`}
)`;

/**
 * Posts eligible for AI digest recommendation: everything the site would show
 * (getViewablePostsSelector) minus deleted drafts, rejected posts, posts
 * restricted to established accounts, posts that opted out of recommendations,
 * group posts, and anything not yet published.
 */
const aiDigestEligiblePostConditions = (postAlias: string) => `
    ${getViewablePostsSelector(postAlias)}
    AND ${postAlias}."deletedDraft" IS FALSE
    AND ${postAlias}.rejected IS FALSE
    AND ${postAlias}."onlyVisibleToEstablishedAccounts" IS FALSE
    AND ${postAlias}."disableRecommendation" IS FALSE
    AND ${postAlias}."groupId" IS NULL
    AND ${postAlias}."postedAt" <= NOW()
`;

/** Posts the reader-profile queries may reference: viewable and already published. */
const aiDigestPublishedPostConditions = (postAlias: string) => `
    ${getViewablePostsSelector(postAlias)}
    AND ${postAlias}."postedAt" <= NOW()
`;

const constructFilters = (
  {
    startDate,
    endDate,
    minKarma,
    showEvents,
  }: FilterPostsForReview,
): [string, Record<string, any>] => {
  const params = {
    ...(startDate && {startDate: startDate.toISOString()}),
    ...(endDate && {endDate: endDate.toISOString()}),
    ...(minKarma && {minKarma}),
  }

  const filters = [
    startDate ? `AND p."postedAt" >= $(startDate)` : '',
    endDate ? `AND p."postedAt" <= $(endDate)` : '',
    minKarma ? `AND p."baseScore" >= $(minKarma)` : '',
    showEvents === false ? 'AND p."isEvent" IS NOT TRUE' : '',
  ].filter(Boolean).join(' ')

  return [filters, params]
}

function filterModeToAdditiveKarmaModifier(mode: FilterMode): number {
  if (typeof mode === 'number') return mode;
  if (mode === 'Subscribed') return 25;
  return 0;
}

function filterModeToMultiplicativeKarmaModifier(mode: FilterMode): number {
  if (typeof mode === 'string' && mode.startsWith('x')) {
    return parseFloat(mode.substring(1)) || 1;
  }
  return 1;
}

function sqlValue(value: string): string {
  return `'${getPgPromiseLib().as.value(value)}'`;
}

/**
 * Constructs a SQL expression for calculating the filteredScore based on filterSettings
 * This mirrors the logic in the "magic" view's filterSettingsToParams function
 */
function constructFilteredScoreSql(filterSettings: FilterSettings, forumType: ForumTypeString): string {
  const tagsSoftFiltered = filterSettings.tags.filter(
    t => t.filterMode !== "Hidden" && t.filterMode !== "Required" && t.filterMode !== "Default"
  );

  const additiveModifiersSql = tagsSoftFiltered.map(tag => `
    (CASE
      WHEN COALESCE((p."tagRelevance"->${sqlValue(tag.tagId)})::INTEGER, 0) > 0
      THEN ${filterModeToAdditiveKarmaModifier(tag.filterMode)}
      ELSE 0
    END)`
  ).join(' + ');

  const multiplicativeModifiersSql = tagsSoftFiltered.map(tag => `
    (CASE
      WHEN COALESCE((p."tagRelevance"->${sqlValue(tag.tagId)})::INTEGER, 0) > 0
      THEN ${filterModeToMultiplicativeKarmaModifier(tag.filterMode)}
      ELSE 1
    END)`
  ).join(' * ');

  const frontpageBonus = 10;
  const curatedBonus = 10;

  const standardScoreModifiers = `
    + (CASE WHEN p."frontpageDate" IS NOT NULL THEN ${frontpageBonus} ELSE 0 END)
    + (CASE WHEN p."curatedDate" IS NOT NULL THEN ${curatedBonus} ELSE 0 END)
  `;
  
  const timeDecayFactor = TIME_DECAY_FACTOR;
  const ageOffset = forumType === 'AlignmentForum' ? 6 : SCORE_BIAS;
  
  const timeDecayDenominatorSql = `
    POWER(
      (EXTRACT(EPOCH FROM NOW() - p."postedAt") / 3600) + ${ageOffset},
      ${timeDecayFactor}
    )
  `;
  
  return `
    (
      (
        p."baseScore"
        ${additiveModifiersSql ? ` + ${additiveModifiersSql}` : ''}
        ${standardScoreModifiers}
      ) -- Numerator End (before multiplication)
      ${multiplicativeModifiersSql ? ` * ${multiplicativeModifiersSql}` : ''}
    ) / ${timeDecayDenominatorSql}
  `;
}

class PostsRepo extends AbstractRepo<"Posts"> {
  constructor() {
    super(Posts);
  }

  /**
   * IDs of every published post the user authored, coauthored, or commented
   * on, i.e. every post page that displays the user's name or avatar.
   */
  async getPostIdsWhereUserAppears(userId: string): Promise<string[]> {
    const rows = await this.getRawDb().any<{ _id: string }>(`
      -- PostsRepo.getPostIdsWhereUserAppears
      SELECT p._id
      FROM "Posts" p
      WHERE p."draft" IS NOT TRUE
        AND (p."userId" = $(userId) OR $(userId) = ANY(p."coauthorUserIds"))
      UNION
      SELECT c."postId" AS _id
      FROM "Comments" c
      WHERE c."userId" = $(userId)
        AND c."postId" IS NOT NULL
        AND c."deleted" IS NOT TRUE
    `, { userId });
    return rows.map((row) => row._id);
  }
  
  moveCoauthorshipToNewUser(oldUserId: string, newUserId: string): Promise<null> {
    return this.none(`
      -- PostsRepo.moveCoauthorshipToNewUser
      UPDATE "Posts"
      SET "coauthorUserIds" = array(
        SELECT CASE
          WHEN user_id = $1 THEN $2
          ELSE user_id
        END
        FROM unnest("coauthorUserIds") AS t(user_id)
      )
      WHERE $1 = ANY("coauthorUserIds");
    `, [oldUserId, newUserId]);
  }

  async getEarliestPostTime(): Promise<Date> {
    const result = await this.oneOrNone(`
      -- PostsRepo.getEarliestPostTime
      SELECT "postedAt" FROM "Posts"
      WHERE ${getViewablePostsSelector()}
      ORDER BY "postedAt" ASC
      LIMIT 1
    `);
    return result?.postedAt ?? new Date();
  }

  async getMeanKarmaByInterval(startDate: Date, averagingWindowMs: number): Promise<MeanPostKarma[]> {
    return this.getRawDb().any(`
      -- PostsRepo.getMeanKarmaByInterval
      SELECT "_id", AVG("baseScore") AS "meanKarma"
      FROM (
        SELECT
          FLOOR(EXTRACT(EPOCH FROM "postedAt" - $1) / ($2 / 1000)) AS "_id",
          "baseScore"
        FROM "Posts"
        WHERE ${getViewablePostsSelector()}
      ) Q
      GROUP BY "_id"
      ORDER BY "_id"
    `, [startDate, averagingWindowMs], "getMeanKarmaByInterval");
  }

  async getMeanKarmaOverall(): Promise<number> {
    const result = await this.getRawDb().oneOrNone(`
      -- PostsRepo.getMeanKarmaOverall
      SELECT AVG("baseScore") AS "meanKarma"
      FROM "Posts"
      WHERE ${getViewablePostsSelector()}
    `, [], "getMeanKarmaOverall");
    return result?.meanKarma ?? 0;
  }
  
  async getReadHistoryForUser(
    userId: string,
    limit: number,
    filter: FilterPostsForReview | null,
    sort: {
      karma?: boolean
    } | null, 
  ): Promise<Array<DbPost & { lastUpdated: Date }>> {
    const orderBy = sort?.karma ? 'p."baseScore" DESC' : 'rs."lastUpdated" DESC';
    const [filters, params] = constructFilters(filter ?? {});

    return await this.getRawDb().manyOrNone(`
      -- PostsRepo.getReadHistoryForUser
      SELECT p.*, rs."lastUpdated"
      FROM "Posts" p
      JOIN "ReadStatuses" rs ON rs."postId" = p."_id"
      WHERE rs."userId" = $(userId)
      ${filters}
      ORDER BY ${orderBy}
      LIMIT $(limit)
    `, {userId, limit, ...params}, 'getReadHistoryForUser')
  }

  async getPostsUserCommentedOn(
    userId: string,
    limit = 20,
    filter: FilterPostsForReview | null,
    sort: {
      karma?: boolean
    } | null,
  ): Promise<DbPost[]> {
    const orderBy = sort?.karma ? 'ORDER BY p."baseScore" DESC' : '';
    const [filters, params] = constructFilters(filter ?? {});

    return this.getRawDb().manyOrNone(`
      -- PostsRepo.getPostsUserCommentedOn
      SELECT DISTINCT p.*
      FROM "Posts" p
      INNER JOIN "Comments" c ON c."postId" = p._id
      WHERE
          c."userId" = $(userId)
          ${filters}
      ${orderBy}
      LIMIT $(limit)
    `, { userId, limit, ...params }, 'getPostsUserCommentedOn');
  }


  getRecentlyActiveDialogues(limit = 3): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getRecentlyActiveDialogues
      SELECT p.*
      FROM "Posts" p
      WHERE p."collabEditorDialogue" IS TRUE AND p.draft IS NOT TRUE
      ORDER BY GREATEST(p."postedAt", p."mostRecentPublishedDialogueResponseDate") DESC
      LIMIT $1
    `, [limit]);
  }

  getMyActiveDialogues(userId: string, limit = 3): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getMyActiveDialogues
      SELECT *
      FROM (
          SELECT DISTINCT ON (_id) *
          FROM "Posts"
          WHERE "collabEditorDialogue" IS TRUE
          AND (("coauthorUserIds" @> ARRAY[$1]::TEXT[]) OR ("userId" = $1))
      ) dialogues
      ORDER BY "modifiedAt" DESC
      LIMIT $2
    `, [userId, limit]);
  }

  async getPostIdsWithoutEmbeddings(): Promise<string[]> {
    const results = await this.getRawDb().any(`
      -- PostsRepo.getPostIdsWithoutEmbeddings
      SELECT p."_id"
      FROM "Posts" p
      LEFT JOIN "Revisions" r ON r."_id" = p."contents_latest"
      LEFT JOIN "PostEmbeddings" pe ON p."_id" = pe."postId"
      WHERE
        ${getViewablePostsSelector('p')} AND
        pe."embeddings" IS NULL AND
        COALESCE((r."wordCount")::INTEGER, 0) > 1
    `);
    return results.map(({_id}) => _id);
  }

  getDigestHighlights({
    maxAgeInDays = 31,
    numPostsPerDigest = 2,
    limit = 10,
  }): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getDigestHighlights
      SELECT p.*
      FROM (
        SELECT
          p."_id",
          d."num" AS "digestNum",
          ROW_NUMBER() OVER(
            PARTITION BY dp."digestId" ORDER BY p."baseScore" DESC
          ) AS "rowNum"
        FROM "Posts" p
        JOIN "DigestPosts" dp ON p."_id" = dp."postId"
        JOIN "Digests" d ON
          dp."digestId" = d."_id" AND
          FLOOR(EXTRACT(EPOCH FROM NOW() - d."startDate") / 86400) <= $1
      ) q
      JOIN "Posts" p ON q."_id" = p."_id"
      WHERE q."rowNum" <= $2
      ORDER BY q."digestNum" DESC, q."rowNum" ASC
      LIMIT $3
    `, [maxAgeInDays, numPostsPerDigest, limit]);
  }

  getCuratedAndPopularPosts({currentUser, days = 7, limit = 3, af}: {
    currentUser?: DbUser | null,
    days?: number,
    limit?: number,
    af?: boolean,
  } = {}) {
    const postFilter = getViewablePostsSelector("p");
    const afFilter = af ? `p."af" IS TRUE AND` : "";
    const readFilter = currentUser
      ? {
        join: `
          LEFT JOIN "ReadStatuses" rs ON
            p."_id" = rs."postId" AND
            rs."userId" = $3
        `,
        filter: `rs."isRead" IS NOT TRUE AND`,
      }
      : {join: "", filter: ""};
    return this.any(`
      -- PostsRepo.getCuratedAndPopularPosts
      SELECT p.*
      FROM "Posts" p
      ${readFilter.join}
      WHERE
        ${afFilter}
        p."curatedDate" > NOW() - ($1 || ' days')::INTERVAL AND
        p."disableRecommendation" IS NOT TRUE AND
        ${readFilter.filter}
        ${postFilter}
      UNION
      SELECT p.*
      FROM "Posts" p
      JOIN "Users" u ON p."userId" = u."_id"
      ${readFilter.join}
      WHERE
        ${afFilter}
        p."curatedDate" IS NULL AND
        p."frontpageDate" > NOW() - ($1 || ' days')::INTERVAL AND
        p."groupId" IS NULL AND
        p."disableRecommendation" IS NOT TRUE AND
        u."deleted" IS NOT TRUE AND
        ${readFilter.filter}
        ${postFilter}
      ORDER BY "curatedDate" DESC NULLS LAST, "baseScore" DESC
      LIMIT $2
    `, [String(days), limit, currentUser?._id]);
  }

  private getSearchDocumentQuery(): string {
    return `
      -- PostsRepo.getSearchDocumentQuery
      SELECT
        p."_id",
        p."_id" AS "objectID",
        p."userId",
        p."url",
        p."title",
        p."slug",
        COALESCE(p."baseScore", 0) AS "baseScore",
        p."status",
        p."curatedDate" IS NOT NULL AND "curatedDate" < NOW() AS "curated",
        p."legacy",
        COALESCE(p."commentCount", 0) AS "commentCount",
        p."postedAt",
        p."createdAt",
        EXTRACT(EPOCH FROM p."postedAt") * 1000 AS "publicDateMs",
        COALESCE(p."isFuture", FALSE) AS "isFuture",
        COALESCE(p."isEvent", FALSE) AS "isEvent",
        COALESCE(p."rejected", FALSE) AS "rejected",
        COALESCE(p."authorIsUnreviewed", FALSE) AS "authorIsUnreviewed",
        COALESCE(p."unlisted", FALSE) AS "unlisted",
        COALESCE(p."viewCount", 0) AS "viewCount",
        p."lastCommentedAt",
        COALESCE(p."draft", FALSE) AS "draft",
        COALESCE(p."af", FALSE) AS "af",
        (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          '_id', t."_id",
          'slug', t."slug",
          'name', t."name"
        )) FROM "Tags" t WHERE
          t."_id" = ANY(fm_post_tag_ids(p."_id")) AND
          t."deleted" IS NOT TRUE
        ) AS "tags",
        CASE
          WHEN author."deleted" THEN NULL
          ELSE author."slug"
        END AS "authorSlug",
        CASE
          WHEN author."deleted" THEN NULL
          ELSE author."displayName"
        END AS "authorDisplayName",
        CASE
          WHEN author."deleted" THEN NULL
          ELSE author."fullName"
        END AS "authorFullName",
        rss."nickname" AS "feedName",
        p."feedLink",
        revision."html" AS "body",
        NOW() AS "exportedAt"
      FROM "Posts" p
      LEFT JOIN "Revisions" revision ON p."contents_latest" = revision."_id"
      LEFT JOIN "Users" author ON p."userId" = author."_id"
      LEFT JOIN "RSSFeeds" rss ON p."feedId" = rss."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<SearchPost> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE p."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchPost[]> {
    return this.getRawDb().any(`
      -- PostsRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      ORDER BY p."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`
      -- PostsRepo.countSearchDocuments
      SELECT COUNT(*) FROM "Posts"
    `);
    return count;
  }

  async getViewablePostsIdsWithTag(tagId: string): Promise<string[]> {
    const results: {_id: string}[] = await this.getRawDb().any(`
      SELECT "_id"
      FROM "Posts"
      WHERE
        ("tagRelevance"->$1)::INT > 0
        AND "baseScore" >= 5
        AND "hideFromRecentDiscussions" IS NOT TRUE
        AND "hideFromPopularComments" IS NOT TRUE
        AND ${getViewablePostsSelector()}
    `, [tagId]);
    return results.map(({_id}) => _id);
  }

  async getUsersReadPostsOfTargetUser(userId: string, targetUserId: string, limit = 20): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getUsersReadPostsOfTargetUser
      SELECT p.*
      FROM "ReadStatuses" rs
      INNER JOIN "Posts" p 
      ON rs."postId" = p._id
      WHERE
          rs."userId" = $1
          AND p."userId" = $2
          AND rs."isRead" IS TRUE
      ORDER BY rs."lastUpdated" DESC
      LIMIT $3
    `, [userId, targetUserId, limit]);
  }

  async getPostsWithElicitData(): Promise<DbPostWithContents[]> {
    return await this.getRawDb().any(`
      -- PostsRepo.getPostsWithElicitData
      SELECT p.*, ROW_TO_JSON(r.*) "contents"
      FROM "Posts" p
      INNER JOIN "Revisions" r ON p."contents_latest" = r."_id"
      WHERE r."html" LIKE '%elicit-binary-prediction%'
    `);
  }

  /**
   * Returns the number of posts that a user has authored in a given year, and their percentile among all users who
   * authored at least one post in that year. This is currently used for Wrapped.
   */
  async getAuthorshipStats({
    userId,
    year,
  }: {
    userId: string;
    year: number;
  }): Promise<{ totalCount: number; percentile: number }> {
    const startPostedAt = new Date(year, 0).toISOString();
    const endPostedAt = new Date(year + 1, 0).toISOString();

    const result = await this.getRawDb().oneOrNone<{ total_count: string; percentile: number }>(
      `
      -- PostsRepo.getAuthorshipStats
      WITH visible_posts AS (
        SELECT
          "userId",
          "coauthorUserIds"
        FROM
          "Posts"
        WHERE
          ${getViewablePostsSelector()}
          AND "postedAt" > $1
          AND "postedAt" < $2
      ),
      authorships AS ((
          SELECT
            "userId"
          FROM
            visible_posts)
        UNION ALL (
          SELECT
            "coauthorUserIds" AS "userId"
          FROM
            visible_posts)
      ),
      authorship_counts AS (
        SELECT
          "userId",
          count(*) AS total_count
        FROM
          authorships
        GROUP BY
          "userId"
      ),
      authorship_percentiles AS (
        SELECT
          "userId",
          total_count,
          percent_rank() OVER (ORDER BY total_count ASC) percentile
        FROM
          authorship_counts
      )
      SELECT
        total_count,
        percentile
      FROM
        authorship_percentiles
      WHERE
        "userId" = $3;
    `,
      [startPostedAt, endPostedAt, userId]
    );

    return {
      totalCount: result?.total_count ? parseInt(result.total_count) : 0,
      percentile: result?.percentile ?? 0,
    };
  }

  /**
   * Returns the number of posts that a user has read that were authored by a given user in a given year, and their
   * percentile among all users who read at least one post by that author in that year. This is currently used for Wrapped.
   */
  async getReadAuthorStats({
    userId,
    authorUserId,
    year,
  }: {
    userId: string;
    authorUserId: string;
    year: number;
  }): Promise<{ totalCount: number; percentile: number }> {
    const startPostedAt = new Date(year, 0, 1);
    const endPostedAt = new Date(year + 1, 0, 1);

    const result = await this.getRawDb().oneOrNone<{ total_count: string; percentile: number }>(
      `
      -- PostsRepo.getReadAuthorStats
      WITH authored_posts AS (
        SELECT DISTINCT _id AS "postId"
        FROM "Posts"
        WHERE
          ${getViewablePostsSelector()}
          AND ("userId" = $3 OR "coauthorUserIds" @> ARRAY[$3]::TEXT[])
      ),
      read_counts AS (
        SELECT
          "userId",
          count(*) AS total_count
        FROM
          authored_posts
          INNER JOIN "ReadStatuses" rs ON authored_posts."postId" = rs."postId" AND rs."isRead" IS TRUE
        WHERE
          "lastUpdated" >= $1
          AND "lastUpdated" < $2
        GROUP BY
          "userId"
      ),
      reader_percentiles AS (
        SELECT
          "userId",
          total_count,
          percent_rank() OVER (ORDER BY total_count ASC) percentile
        FROM
          read_counts
      )
      SELECT
        total_count,
        percentile
      FROM
        reader_percentiles
      WHERE
        "userId" = $4;
    `,
      [startPostedAt, endPostedAt, authorUserId, userId]
    );

    return {
      totalCount: result?.total_count ? parseInt(result.total_count) : 0,
      percentile: result?.percentile ?? 0,
    };
  }
  
  /**
   * Checks the posts that the user had read in the past 6 months,
   * and returns the number of posts per core tag that they have read.
   */
  async getUserReadsPerCoreTag(userId: string): Promise<{tagId: string; userReadCount: number;}[]> {
    return await this.getRawDb().any(
      `
      -- PostsRepo.getUserReadsPerCoreTag
      WITH core_tags AS (
        SELECT _id
        FROM "Tags"
        WHERE core IS TRUE AND deleted is not true
      )
      
      SELECT
        tr."tagId",
        count(*) AS "userReadCount"
      FROM
        "ReadStatuses" rs
      INNER JOIN "TagRels" tr ON rs."postId" = tr."postId"
      WHERE
        rs."lastUpdated" >= NOW() - interval '6 months'
        AND rs."userId" = $1
        AND rs."isRead" IS TRUE
        AND (
          tr."tagId" = 'u3Xg8MjDe2e6BvKtv' -- special case to include "AI governance"
          OR tr."tagId" IN (SELECT _id FROM core_tags)
        )
        AND tr."deleted" IS FALSE
      GROUP BY tr."tagId"
      `,
      [userId]
    )
  }

  /**
   * Get stats on how much the given user reads each core topic (excluding "Opportunities"),
   * relative to the average user. This is currently used for Wrapped.
   */
  async getReadCoreTagStats({
    userId,
    year,
  }: {
    userId: string;
    year: number;
  }): Promise<{ tagId: string; tagName: string; tagShortName: string; userReadCount: number; readLikelihoodRatio: number }[]> {
    const startPostedAt = new Date(year, 0, 1);
    const endPostedAt = new Date(year + 1, 0, 1);

    const results = await this.getRawDb().any<{ tagId: string; name: string; shortName: string; read_count: number; ratio: number }>(
      `
      -- PostsRepo.getReadCoreTagStats
      WITH core_tags AS (
          SELECT _id
          FROM "Tags"
          WHERE core IS TRUE AND deleted is not true AND _id != 'z8qFsGt5iXyZiLbjN'
      ),
      read_posts AS (
          SELECT
              *
          FROM
              "ReadStatuses" rs
          WHERE
              rs."lastUpdated" >= $1
              AND rs."lastUpdated" < $2
              AND rs."isRead" IS TRUE
      ),
      total_reads_by_tag AS (
          SELECT
              tr."tagId",
              count(*) AS read_count
          FROM
              read_posts
              INNER JOIN "TagRels" tr ON read_posts."postId" = tr."postId"
          WHERE
              tr."tagId" IN (SELECT _id FROM core_tags)
              AND tr."deleted" IS FALSE
          GROUP BY
              tr."tagId"
      ),
      user_reads_by_tag AS (
          SELECT
              tr."tagId",
              count(*) AS read_count
          FROM
              read_posts
              INNER JOIN "TagRels" tr ON read_posts."postId" = tr."postId"
          WHERE
              read_posts."userId" = $3
              AND tr."tagId" IN (SELECT _id FROM core_tags)
              AND tr."deleted" IS FALSE
          GROUP BY
              tr."tagId"
      ),
      total_reads AS (
          SELECT
              sum(read_count) AS total_count
          FROM
              total_reads_by_tag
      ),
      user_reads AS (
          SELECT
              sum(read_count) AS total_count
          FROM
              user_reads_by_tag
      )
      SELECT
          tr."tagId",
          t.name,
          t."shortName",
          ur.read_count,
          (coalesce(ur.read_count::float, 0.0) / user_reads.total_count) / (tr.read_count::float / total_reads.total_count) AS ratio
      FROM
          total_reads_by_tag tr
          LEFT JOIN user_reads_by_tag ur ON tr."tagId" = ur."tagId"
          INNER JOIN "Tags" t ON tr."tagId" = t._id,
          total_reads,
          user_reads
      ORDER BY
          ratio DESC;
    `,
      [startPostedAt, endPostedAt, userId]
    );

    return results.map(({ tagId, name, shortName, read_count, ratio }) => ({
      tagId,
      tagName: name,
      tagShortName: shortName,
      userReadCount: read_count,
      readLikelihoodRatio: ratio
    }));
  }

  async getActivelyDiscussedPosts(limit: number) {
    return await this.any(`
      WITH post_ids AS (
        SELECT "postId" AS _id,
        COALESCE(SUM(c."baseScore") FILTER (WHERE c."baseScore" > 5), 0) AS total_karma_from_high_karma_comments
        FROM "Comments" c
              LEFT JOIN "Posts" p ON p._id = c."postId"
        WHERE c."postedAt" > CURRENT_TIMESTAMP - INTERVAL '14 days'
        AND p.shortform IS NOT TRUE
        GROUP BY c."postId"
        HAVING COUNT(*) FILTER (WHERE c."baseScore" > 10) > 0
        ORDER BY COALESCE(SUM(c."baseScore") FILTER (WHERE c."baseScore" > 5), 0)
      )
      SELECT
          p.*
      FROM "Posts" p
      JOIN post_ids pid USING (_id)
      ORDER BY pid.total_karma_from_high_karma_comments DESC
      LIMIT $1
    `,
    [limit]);
  }

  async getPostsFromPostSubscriptions(userId: string, limit: number) {
    // 2024-04-26: This is used on a prototype subscriptions tab that's currently disabled, which might be dropped entirely and replaced with a better subscriptions tab
    return await this.any(`
      WITH user_subscriptions AS (
        SELECT DISTINCT type, "documentId" AS "userId"
        FROM "Subscriptions" s
        WHERE state = 'subscribed'
          AND s.deleted IS NOT TRUE
          AND "collectionName" = 'Users'
          AND "type" = 'newPosts'
          AND "userId" = $1
        )
      SELECT *
      FROM "Posts" p
      JOIN user_subscriptions us USING ("userId")
      WHERE p."postedAt" > CURRENT_TIMESTAMP - INTERVAL '90 days'
        AND type = 'newPosts'
        AND shortform IS NOT TRUE 
        AND draft IS NOT TRUE
      ORDER BY p."postedAt" DESC
      LIMIT $2
    `, 
    [userId, limit]);
  }
  
  async ensurePostHasNonDraftContents(postId: string) {
    await this.none(`
      UPDATE "Revisions" AS r
      SET
        "draft" = FALSE,
        "version" = CASE WHEN LEFT("version", 1) = '0' THEN '1.0.0' ELSE "version" END
      FROM "Posts" AS p
      WHERE
        p._id = $(postId)
        AND p."contents_latest" = r."_id"
        AND p."draft" IS NOT TRUE
        AND r."draft" IS TRUE
    `, {
      postId
    });
  }

  async getPostsWithApprovedJargon(limit: number): Promise<Array<DbPost & { jargonTerms: DbJargonTerm[] }>> {
    return this.getRawDb().any(`
      SELECT DISTINCT p.*, JSONB_AGG(jt.*) AS "jargonTerms"
      FROM "Posts" p
      JOIN "JargonTerms" jt
      ON p._id = jt."postId"
      WHERE jt."approved" IS TRUE
      AND ${getViewablePostsSelector('p')}
      GROUP BY p._id
      ORDER BY p."postedAt" DESC
      LIMIT $1
    `, [limit]);
  }

  /**
   * Combined query for UltraFeed that gets both latest posts and subscribed posts in one efficient query.
   * Posts from subscribed users will have both 'hacker-news' and 'subscriptions' in their sources.
   * Directly filters out read posts internally.
   */
  async getLatestAndSubscribedFeedPosts(
    context: ResolverContext,
    {
      filterSettings,
      maxAgeDays,
      limit = 100,
      restrictToFollowedAuthors = false,
      filterOutReadOrViewed = true,
    }: {
      filterSettings: FilterSettings;
      maxAgeDays: number;
      limit?: number;
      restrictToFollowedAuthors?: boolean;
      filterOutReadOrViewed?: boolean;
    },
  ): Promise<FeedFullPost[]> {
    const { currentUser, clientId } = context;
    const userIdOrClientId = currentUser?._id ?? clientId;

    const tagsRequired = filterSettings.tags.filter(t => t.filterMode === "Required");
    const tagsExcluded = filterSettings.tags.filter(t => t.filterMode === "Hidden");
    
    const tagRequiredConditions = tagsRequired.map(tag => 
      `COALESCE((p."tagRelevance"->${sqlValue(tag.tagId)})::INTEGER, 0) >= 1`
    ).join(' AND ');
    
    const tagExcludedConditions = tagsExcluded.map(tag => 
      `COALESCE((p."tagRelevance"->${sqlValue(tag.tagId)})::INTEGER, 0) < 1`
    ).join(' AND ');
    
    const tagFilterClause = [
      tagRequiredConditions ? `(${tagRequiredConditions})` : null,
      tagExcludedConditions ? `(${tagExcludedConditions})` : null,
    ].filter(Boolean).join(' AND ');
    
    const personalBlogFilter = filterSettings.personalBlog === "Hidden" 
      ? 'AND p."frontpageDate" IS NOT NULL' 
      : '';

    const filteredScoreSql = constructFilteredScoreSql(filterSettings, context.forumType);
    const hiddenPostIds = currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];
    const hiddenPostIdsCondition = hiddenPostIds.length > 0 
      ? `AND p."_id" NOT IN ($(hiddenPostIds:csv))` 
      : '';

    type LatestSubscribedFeedPostRow = DbPost & {
      initialFilteredScore: number,
      isFromSubscribedUser: boolean,
      lastViewed: Date | null,
      lastInteracted: Date | null,
      isRead: boolean,
    };

    const feedPostsData = await this.getRawDb().manyOrNone<LatestSubscribedFeedPostRow>(`
      -- PostsRepo.getLatestAndSubscribedFeedPosts
      WITH followed_authors AS (
        SELECT DISTINCT s."documentId" AS "userId"
        FROM "Subscriptions" s
        WHERE s."userId" = $(userId)
          AND s.state = 'subscribed'
          AND s.deleted IS NOT TRUE
          AND s."collectionName" = 'Users'
          AND s."type" IN ('newActivityForFeed', 'newPosts')
      ),
      ufe_limited AS (
        SELECT "documentId", "createdAt", "eventType"
        FROM "UltraFeedEvents"
        WHERE 
          "userId" = $(userId)
          AND "collectionName" = 'Posts'
          AND "createdAt" > NOW() - INTERVAL '$(maxAgeDays) days'
        ORDER BY "createdAt" DESC
        LIMIT 2000
      ),
      read_state AS (
        SELECT
          ce."documentId",
          MAX(CASE WHEN ce."eventType" = 'viewed' THEN ce."createdAt" ELSE NULL END) AS "lastViewed",
          MAX(CASE WHEN ce."eventType" <> 'viewed' AND ce."eventType" <> 'served' THEN ce."createdAt" ELSE NULL END) AS "lastInteracted"
        FROM (
          SELECT "documentId", "createdAt", "eventType" FROM ufe_limited
          UNION ALL
          SELECT rs."postId" AS "documentId", rs."lastUpdated" AS "createdAt", 'viewed' AS "eventType"
          FROM "ReadStatuses" rs
          WHERE rs."userId" = $(userId)
            AND rs."lastUpdated" > NOW() - INTERVAL '$(maxAgeDays) days'
        ) ce
        GROUP BY ce."documentId"
      )
      SELECT 
        p.*,
        (${filteredScoreSql}) AS "initialFilteredScore",
        (fa."userId" IS NOT NULL) AS "isFromSubscribedUser",
        rs."lastViewed",
        rs."lastInteracted",
        (rs."lastViewed" IS NOT NULL OR rs."lastInteracted" IS NOT NULL) AS "isRead"
      FROM "Posts" p
      LEFT JOIN followed_authors fa ON fa."userId" = p."userId"
      LEFT JOIN read_state rs ON rs."documentId" = p._id
      WHERE
        p."postedAt" > NOW() - INTERVAL '$(maxAgeDays) days'
        AND p."baseScore" >= 2
        AND p.rejected IS NOT TRUE
        AND ${getViewablePostsSelector('p')}
        ${filterOutReadOrViewed ? 'AND rs."lastViewed" IS NULL' : ''}
        AND (CASE WHEN $(restrictToFollowedAuthors) THEN fa."userId" IS NOT NULL ELSE TRUE END)
        ${personalBlogFilter}
        ${hiddenPostIdsCondition}
        ${tagFilterClause ? `AND ${tagFilterClause}` : ''}
      ORDER BY 
        (CASE WHEN fa."userId" IS NOT NULL THEN 1 ELSE 0 END) DESC,
        ${restrictToFollowedAuthors ? '"postedAt"' : '"initialFilteredScore"'} DESC
      LIMIT $(limit)
    `, { 
      userId: userIdOrClientId,
      maxAgeDays,
      hiddenPostIds,
      limit,
      restrictToFollowedAuthors
    });

    // Preserve meta fields before running access filtering
    const metaInfoById = new Map(feedPostsData.map(p => [p._id!, { 
      isFromSubscribedUser: p.isFromSubscribedUser,
      lastViewed: p.lastViewed,
      lastInteracted: p.lastInteracted,
      isRead: p.isRead,
    }]));
    const filteredPosts: Partial<DbPost>[] = await accessFilterMultiple(currentUser, 'Posts', feedPostsData, context);

    return filteredPosts.map((post): FeedFullPost => {
      const metaInfo = metaInfoById.get(post._id!);
      const isFromSubscribedUser = metaInfo?.isFromSubscribedUser ?? false;
      // Determine sources - all posts are "latest" (hacker-news) and posts from subscribed users also get "subscriptionsPosts"
      const sources: FeedItemSourceType[] = ['hacker-news'];
      if (isFromSubscribedUser) {
        sources.push('subscriptionsPosts');
      }
      
      return {
        post,
        postMetaInfo: {
          sources,
          displayStatus: 'expanded',
          lastViewed: metaInfo?.lastViewed ?? null,
          lastInteracted: metaInfo?.lastInteracted ?? null,
          highlight: filterOutReadOrViewed ? true : !(metaInfo?.isRead ?? false),
        },
      };
    });
  }

  /**
   * Get read status for multiple posts efficiently
   * Returns a map of postId -> isRead boolean
   */
  async getPostReadStatuses(
    postIds: string[],
    userId: string | null,
  ): Promise<Map<string, boolean>> {
    if (!userId || postIds.length === 0) {
      return new Map();
    }

    const result = await this.getRawDb().manyOrNone<{ postId: string; isRead: boolean }>(`
      SELECT 
        p._id as "postId",
        CASE 
          WHEN rs."lastUpdated" IS NOT NULL OR ue."lastViewed" IS NOT NULL OR ue."lastInteracted" IS NOT NULL 
          THEN true 
          ELSE false 
        END as "isRead"
      FROM UNNEST($1::text[]) AS p(_id)
      LEFT JOIN "ReadStatuses" rs ON 
        rs."postId" = p._id 
        AND rs."userId" = $2
        AND rs."isRead" = true
      LEFT JOIN (
        SELECT 
          "documentId",
          MAX(CASE WHEN "eventType" = 'viewed' THEN "createdAt" ELSE NULL END) as "lastViewed",
          MAX(CASE WHEN "eventType" IN ('upvote', 'downvote', 'strongUpvote', 'strongDownvote', 'comment') THEN "createdAt" ELSE NULL END) as "lastInteracted"
        FROM "UltraFeedEvents"
        WHERE 
          "userId" = $2
          AND "documentId" = ANY($1::text[])
          AND "collectionName" = 'Posts'
        GROUP BY "documentId"
      ) ue ON ue."documentId" = p._id
    `, [postIds, userId]);

    return new Map(result.map(row => [row.postId, row.isRead]));
  }
  
  async getHomepageCommunityEvents(limit: number): Promise<Array<HomepageCommunityEventMarker>> {
    return this.getRawDb().any<HomepageCommunityEventMarker>(`
      -- PostsRepo.getHomepageCommunityEvents
      SELECT 
        _id, 
        "googleLocation" -> 'geometry' -> 'location' ->> 'lat' AS "lat",
        "googleLocation" -> 'geometry' -> 'location' ->> 'lng' AS "lng",
        "types"
      FROM "Posts" p
      WHERE ${getViewableEventsSelector('p')}
      AND "startTime" > NOW()
      AND "startTime" < NOW() + INTERVAL '5 months'
      AND "googleLocation" -> 'geometry' -> 'location' ->> 'lat' IS NOT NULL
      AND "googleLocation" -> 'geometry' -> 'location' ->> 'lng' IS NOT NULL
      LIMIT $1
    `, [limit]);
  }

  /**
   * Posts the AI digest may recommend to the reader, with the reader's own
   * relationship to each. Either the most recent eligible posts since
   * `minPostedAt`, or the eligible ones among `postIds`. Never includes the
   * reader's own posts, posts they hid, or posts they asked to see less of.
   */
  async getAiDigestPostCandidates({
    userId,
    aboutPostId,
    minKarma,
    minPostedAt = null,
    postIds = null,
    limit = null,
  }: {
    userId: string;
    aboutPostId: string;
    minKarma: number;
    minPostedAt?: Date | null;
    postIds?: string[] | null;
    limit?: number | null;
  }): Promise<AiDigestPostCandidateRow[]> {
    return this.getRawDb().manyOrNone<AiDigestPostCandidateRow>(`
      -- PostsRepo.getAiDigestPostCandidates
      SELECT
        p."_id" AS "postId",
        p."contents_latest" AS "revisionId",
        p.title,
        ${aiDigestPostAuthorExpression("p", "u")} AS author,
        p."postedAt",
        p."baseScore",
        ROUND(p.score::NUMERIC, 2)::FLOAT AS "decayedScore",
        ${aiDigestPostTagNamesSubquery(`p."_id"`, 8)} AS tags,
        (p."curatedDate" IS NOT NULL) AS curated,
        EXISTS (
          SELECT 1 FROM "ReadStatuses" rs
          WHERE rs."userId" = $(userId) AND rs."postId" = p."_id" AND rs."isRead" IS TRUE
        ) AS "hasReadStatus",
        upvote.liked,
        (
          p."hideAuthor" IS FALSE
          AND (p."userId" IN (${readerFollowedAuthorIds}) OR p."coauthorUserIds" && ARRAY(${readerFollowedAuthorIds})::TEXT[])
        ) AS "followsAuthor"
      FROM "Posts" p
      LEFT JOIN "Users" u ON u."_id" = p."userId"
      ${joinReaderUpvote("Posts", `p."_id"`, "upvote")}
      WHERE ${aiDigestEligiblePostConditions("p")}
        AND p."baseScore" >= $(minKarma)
        AND p."_id" <> $(aboutPostId)
        AND p."contents_latest" IS NOT NULL
        AND ($(postIds)::TEXT[] IS NULL OR p."_id" = ANY($(postIds)::TEXT[]))
        AND ($(minPostedAt)::TIMESTAMPTZ IS NULL OR p."postedAt" >= $(minPostedAt))
        AND p."userId" IS DISTINCT FROM $(userId)
        AND NOT ($(userId) = ANY(p."coauthorUserIds"))
        AND NOT EXISTS (
          SELECT 1 FROM "Users" reader, unnest(reader."hiddenPostsMetadata") hidden
          WHERE reader."_id" = $(userId) AND hidden ->> 'postId' = p."_id"
        )
        AND NOT ${readerSeesLessOf("Posts", `p."_id"`)}
      ORDER BY p."postedAt" DESC, p."baseScore" DESC, p."_id"
      LIMIT $(limit)
    `, { userId, aboutPostId, minKarma, minPostedAt, postIds, limit });
  }

  /** The most recently curated posts, newest curation first, and whether the reader has read each. */
  async getAiDigestRecentlyCuratedPosts({ userId, limit }: {
    userId: string;
    limit: number;
  }): Promise<AiDigestRecentlyCuratedPostRow[]> {
    return this.getRawDb().manyOrNone<AiDigestRecentlyCuratedPostRow>(`
      -- PostsRepo.getAiDigestRecentlyCuratedPosts
      SELECT
        p."_id" AS "postId",
        EXISTS (
          SELECT 1 FROM "ReadStatuses" rs
          WHERE rs."userId" = $(userId) AND rs."postId" = p."_id" AND rs."isRead" IS TRUE
        ) AS "isRead"
      FROM "Posts" p
      WHERE ${getViewablePostsSelector("p")}
        AND p."deletedDraft" IS FALSE
        AND p.rejected IS FALSE
        AND p."curatedDate" <= NOW()
      ORDER BY p."curatedDate" DESC
      LIMIT $(limit)
    `, { userId, limit });
  }

  /** How much the reader reads: lifetime and recent counts, and how old posts were when read. */
  async getAiDigestReaderReadStats({ userId, now }: {
    userId: string;
    now: Date;
  }): Promise<AiDigestReaderReadStats> {
    return this.getRawDb().one<AiDigestReaderReadStats>(`
      -- PostsRepo.getAiDigestReaderReadStats
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE rs."lastUpdated" >= $(now)::TIMESTAMPTZ - INTERVAL '30 days')::INT AS "last30Days",
        COUNT(*) FILTER (WHERE read."isRecent")::INT AS "last180Days",
        json_build_object(
          'under7Days', COUNT(*) FILTER (WHERE read."isRecent" AND read."postAge" < INTERVAL '7 days'),
          'from7To30Days', COUNT(*) FILTER (
            WHERE read."isRecent" AND read."postAge" >= INTERVAL '7 days' AND read."postAge" < INTERVAL '31 days'
          ),
          'from31To180Days', COUNT(*) FILTER (
            WHERE read."isRecent" AND read."postAge" >= INTERVAL '31 days' AND read."postAge" < INTERVAL '181 days'
          ),
          'over180Days', COUNT(*) FILTER (WHERE read."isRecent" AND read."postAge" >= INTERVAL '181 days')
        ) AS "readsByPostAge"
      FROM "ReadStatuses" rs
      LEFT JOIN "Posts" p ON p."_id" = rs."postId"
      CROSS JOIN LATERAL (
        SELECT
          rs."lastUpdated" >= $(now)::TIMESTAMPTZ - INTERVAL '180 days' AS "isRecent",
          CASE WHEN p."postedAt" <= rs."lastUpdated" THEN rs."lastUpdated" - p."postedAt" END AS "postAge"
      ) read
      WHERE rs."userId" = $(userId)
        AND rs."isRead" IS TRUE
    `, { userId, now });
  }

  /** Authors whose posts the reader has read most since `since`, most-read first. */
  async getAiDigestReaderTopAuthors({ userId, since, limit }: {
    userId: string;
    since: Date;
    limit: number;
  }): Promise<AiDigestReaderAffinityRow[]> {
    return this.getRawDb().manyOrNone<AiDigestReaderAffinityRow>(`
      -- PostsRepo.getAiDigestReaderTopAuthors
      SELECT
        COALESCE(u."displayName", p.author, 'LessWrong contributor') AS name,
        COUNT(DISTINCT rs."postId")::INT AS reads
      FROM "ReadStatuses" rs
      INNER JOIN "Posts" p ON p."_id" = rs."postId"
      INNER JOIN "Users" u ON u."_id" = p."userId"
      WHERE rs."userId" = $(userId)
        AND rs."isRead" IS TRUE
        AND rs."lastUpdated" >= $(since)
        AND ${aiDigestPublishedPostConditions("p")}
        AND p."hideAuthor" IS FALSE
      GROUP BY p."userId", u."displayName", p.author
      ORDER BY reads DESC, p."userId"
      LIMIT $(limit)
    `, { userId, since, limit });
  }

  /** Topics of the posts the reader has read most since `since`, most-read first. */
  async getAiDigestReaderTopTopics({ userId, since, limit }: {
    userId: string;
    since: Date;
    limit: number;
  }): Promise<AiDigestReaderAffinityRow[]> {
    return this.getRawDb().manyOrNone<AiDigestReaderAffinityRow>(`
      -- PostsRepo.getAiDigestReaderTopTopics
      SELECT
        COALESCE(t."shortName", t.name) AS name,
        COUNT(DISTINCT rs."postId")::INT AS reads
      FROM "ReadStatuses" rs
      INNER JOIN "Posts" p ON p."_id" = rs."postId"
      INNER JOIN "TagRels" tr ON tr."postId" = p."_id"
      INNER JOIN "Tags" t ON t."_id" = tr."tagId"
      WHERE rs."userId" = $(userId)
        AND rs."isRead" IS TRUE
        AND rs."lastUpdated" >= $(since)
        AND ${aiDigestPublishedPostConditions("p")}
        AND tr.deleted IS FALSE
        AND tr."baseScore" > 0
        AND t.deleted IS FALSE
      GROUP BY t."_id", t."shortName", t.name
      ORDER BY reads DESC, t."_id"
      LIMIT $(limit)
    `, { userId, since, limit });
  }

  /**
   * Posts the reader recently read, upvoted, wrote, or commented on (the most
   * recent `limitPerKind` of each), with every one of those interactions they
   * had with each post, most recently engaged first.
   */
  async getAiDigestReaderRecentPosts({ userId, since, limitPerKind }: {
    userId: string;
    since: Date;
    limitPerKind: number;
  }): Promise<AiDigestReaderRecentPostRow[]> {
    return this.getRawDb().manyOrNone<AiDigestReaderRecentPostRow>(`
      -- PostsRepo.getAiDigestReaderRecentPosts
      WITH reads AS (
        SELECT rs."postId", rs."lastUpdated" AS "at"
        FROM "ReadStatuses" rs
        INNER JOIN "Posts" p ON p."_id" = rs."postId"
        WHERE rs."userId" = $(userId)
          AND rs."isRead" IS TRUE
          AND rs."lastUpdated" >= $(since)
          AND ${aiDigestPublishedPostConditions("p")}
        ORDER BY rs."lastUpdated" DESC
        LIMIT $(limitPerKind)
      ),
      likes AS (
        SELECT * FROM (
          SELECT DISTINCT ON (v."documentId")
            v."documentId" AS "postId",
            v."votedAt" AS "at",
            CASE WHEN v."voteType" = 'bigUpvote' THEN 'strong' ELSE 'regular' END AS liked
          FROM "Votes" v
          INNER JOIN "Posts" p ON p."_id" = v."documentId"
          WHERE v."userId" = $(userId)
            AND v."collectionName" = 'Posts'
            AND v."voteType" IN ('smallUpvote', 'bigUpvote')
            AND v.cancelled IS FALSE
            AND v."isUnvote" IS FALSE
            AND v."votedAt" >= $(since)
            AND ${aiDigestPublishedPostConditions("p")}
          ORDER BY v."documentId", v."votedAt" DESC
        ) latest_likes
        ORDER BY "at" DESC
        LIMIT $(limitPerKind)
      ),
      authored AS (
        SELECT p."_id" AS "postId", p."postedAt" AS "at"
        FROM "Posts" p
        WHERE (p."userId" = $(userId) OR $(userId) = ANY(p."coauthorUserIds"))
          AND p."postedAt" >= $(since)
          AND ${aiDigestPublishedPostConditions("p")}
        ORDER BY p."postedAt" DESC
        LIMIT $(limitPerKind)
      ),
      commented AS (
        SELECT c."postId", MAX(c."postedAt") AS "at"
        FROM "Comments" c
        INNER JOIN "Posts" p ON p."_id" = c."postId"
        WHERE c."userId" = $(userId)
          AND c."postedAt" >= $(since)
          AND c.draft IS FALSE
          AND c.deleted IS FALSE
          AND c.rejected IS FALSE
          AND ${aiDigestPublishedPostConditions("p")}
        GROUP BY c."postId"
        ORDER BY "at" DESC
        LIMIT $(limitPerKind)
      )
      SELECT
        p.title,
        ${aiDigestPostAuthorExpression("p", "u")} AS author,
        p."postedAt",
        reads."at" AS "readAt",
        likes.liked,
        likes."at" AS "likedAt",
        authored."at" AS "authoredAt",
        commented."at" AS "commentedAt"
      FROM "Posts" p
      LEFT JOIN "Users" u ON u."_id" = p."userId"
      LEFT JOIN reads ON reads."postId" = p."_id"
      LEFT JOIN likes ON likes."postId" = p."_id"
      LEFT JOIN authored ON authored."postId" = p."_id"
      LEFT JOIN commented ON commented."postId" = p."_id"
      WHERE COALESCE(reads."postId", likes."postId", authored."postId", commented."postId") IS NOT NULL
      ORDER BY GREATEST(reads."at", likes."at", authored."at", commented."at") DESC, p."_id"
    `, { userId, since, limitPerKind });
  }

  /**
   * The reader's recent un-cancelled "see less" feedback with its target's
   * context, followed by the posts they most recently hid.
   */
  async getAiDigestReaderNegativePreferences({ userId, since, limit }: {
    userId: string;
    since: Date;
    limit: number;
  }): Promise<AiDigestReaderNegativePreferenceRow[]> {
    return this.getRawDb().manyOrNone<AiDigestReaderNegativePreferenceRow>(`
      -- PostsRepo.getAiDigestReaderNegativePreferences
      (
        SELECT
          'seeLess' AS kind,
          ufe."collectionName",
          target_post.title,
          CASE
            WHEN ufe."collectionName" = 'Comments'
              THEN COALESCE(target_comment_author."displayName", 'LessWrong contributor')
            WHEN ufe."collectionName" = 'Posts'
              THEN ${aiDigestPostAuthorExpression("target_post", "target_post_author")}
          END AS author,
          ${aiDigestPostTagNamesSubquery(`target_post."_id"`)} AS topics,
          ufe."createdAt" AS "feedbackAt",
          ufe.event -> 'feedbackReasons' AS "feedbackReasons"
        FROM "UltraFeedEvents" ufe
        LEFT JOIN "Comments" target_comment
          ON ufe."collectionName" = 'Comments'
          AND target_comment."_id" = ufe."documentId"
        LEFT JOIN "Posts" target_post
          ON target_post."_id" = CASE
            WHEN ufe."collectionName" = 'Posts' THEN ufe."documentId"
            WHEN ufe."collectionName" = 'Comments' THEN target_comment."postId"
          END
          AND ${aiDigestPublishedPostConditions("target_post")}
        LEFT JOIN "Users" target_post_author ON target_post_author."_id" = target_post."userId"
        LEFT JOIN "Users" target_comment_author ON target_comment_author."_id" = target_comment."userId"
        WHERE ufe."userId" = $(userId)
          AND ufe."eventType" = 'seeLess'
          AND COALESCE((ufe.event ->> 'cancelled')::BOOLEAN, FALSE) IS FALSE
          AND ufe.event ? 'feedbackReasons'
          AND ufe."createdAt" >= $(since)
        ORDER BY ufe."createdAt" DESC, ufe."_id"
        LIMIT $(limit)
      )
      UNION ALL
      (
        SELECT
          'hidden' AS kind,
          'Posts' AS "collectionName",
          p.title,
          ${aiDigestPostAuthorExpression("p", "u")} AS author,
          ${aiDigestPostTagNamesSubquery(`p."_id"`)} AS topics,
          NULL AS "feedbackAt",
          NULL AS "feedbackReasons"
        FROM "Users" reader
        CROSS JOIN LATERAL unnest(reader."hiddenPostsMetadata") WITH ORDINALITY AS hidden(metadata, position)
        INNER JOIN "Posts" p ON p."_id" = hidden.metadata ->> 'postId'
        LEFT JOIN "Users" u ON u."_id" = p."userId"
        WHERE reader."_id" = $(userId)
          AND ${aiDigestPublishedPostConditions("p")}
        ORDER BY hidden.position DESC
        LIMIT $(limit)
      )
    `, { userId, since, limit });
  }

  /**
   * How the reader has engaged with the given posts: when they last read each,
   * and their current upvote. In the order of `postIds`.
   */
  async getAiDigestPastPostOutcomes({ userId, postIds }: {
    userId: string;
    postIds: string[];
  }): Promise<AiDigestPastPostOutcomeRow[]> {
    if (postIds.length === 0) {
      return [];
    }
    return this.getRawDb().manyOrNone<AiDigestPastPostOutcomeRow>(`
      -- PostsRepo.getAiDigestPastPostOutcomes
      SELECT
        p."_id" AS "postId",
        p.title,
        ${aiDigestPostAuthorExpression("p", "u")} AS author,
        p."postedAt",
        (
          SELECT MAX(rs."lastUpdated") FROM "ReadStatuses" rs
          WHERE rs."userId" = $(userId) AND rs."postId" = p."_id" AND rs."isRead" IS TRUE
        ) AS "readAt",
        upvote.liked,
        upvote."likedAt"
      FROM "Posts" p
      LEFT JOIN "Users" u ON u."_id" = p."userId"
      ${joinReaderUpvote("Posts", `p."_id"`, "upvote")}
      WHERE p."_id" = ANY($(postIds)::TEXT[])
        AND p."postedAt" IS NOT NULL
      ORDER BY array_position($(postIds)::TEXT[], p."_id")
    `, { userId, postIds });
  }

  getCurationCandidatePosts(limit: number): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getCurationCandidatePosts
      SELECT p.*
      FROM "Posts" p
      WHERE p."draft" IS NOT TRUE
        AND p."deletedDraft" IS NOT TRUE
        AND p."status" = 2
        AND p."curatedDate" IS NULL
        AND (
          (p."suggestForCuratedUserIds" IS NOT NULL
            AND array_length(p."suggestForCuratedUserIds", 1) > 0
            AND p."postedAt" > NOW() - INTERVAL '60 days')
          OR
          (p."baseScore" > 100
            AND p."postedAt" > NOW() - INTERVAL '30 days')
        )
      ORDER BY (CASE WHEN EXISTS (
        SELECT 1 FROM "CurationNotices" cn WHERE cn."postId" = p."_id" AND cn."deleted" IS NOT TRUE
      ) THEN 0 ELSE 1 END),
      COALESCE(array_length(p."suggestForCuratedUserIds", 1), 0) DESC,
      p."postedAt" DESC
      LIMIT $(limit)
    `, { limit });
  }
  async getLastCuratedDate(): Promise<Date | null> {
    const row = await this.oneOrNone(`
      -- PostsRepo.getLastCuratedDate
      SELECT p."curatedDate"
      FROM "Posts" p
      WHERE p."curatedDate" IS NOT NULL
      ORDER BY p."curatedDate" DESC
      LIMIT 1
    `);
    return row?.curatedDate ?? null;
  }
}

recordPerfMetrics(PostsRepo);

export default PostsRepo;
