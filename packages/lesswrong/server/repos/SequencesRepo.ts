import AbstractRepo from "./AbstractRepo";
import Sequences from "../../server/collections/sequences/collection";
import keyBy from "lodash/keyBy";
import { getViewablePostsSelector, getViewableSequencesSelector } from "./helpers";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { READ_WORDS_PER_MINUTE } from "@/lib/collections/posts/constants";
import { LIBRARY_TOPICS, LIBRARY_TOPIC_TAG_SLUGS, isLibraryTopic } from "@/lib/collections/sequences/libraryTopics";
import { LIBRARY_RANKING_SHARED_CTES, getLibraryRankingSql } from "./librarySequenceRankingSql";

// A sequence "holds" a library topic when at least half its posts have the
// topic's tag (LIBRARY_TOPIC_TAG_SLUGS). The set-based subqueries below and
// the libraryTopics sqlResolver in lib/collections/sequences/newSchema.ts
// must stay in sync on this rule.

class SequencesRepo extends AbstractRepo<"Sequences"> {
  constructor() {
    super(Sequences);
  }

  private getSearchDocumentQuery(): string {
    return `
      -- SequencesRepo.getSearchDocumentQuery
      SELECT
        s."_id",
        s."_id" AS "objectID",
        s."title",
        s."userId",
        s."createdAt",
        EXTRACT(EPOCH FROM s."createdAt") * 1000 AS "publicDateMs",
        COALESCE(s."isDeleted", FALSE) AS "isDeleted",
        COALESCE(s."draft", FALSE) AS "draft",
        COALESCE(s."hidden", FALSE) AS "hidden",
        COALESCE(s."af", FALSE) AS "af",
        s."bannerImageId",
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
          ELSE author."username"
        END AS "authorUserName",
        s."contents"->>'html' AS "plaintextDescription",
        NOW() AS "exportedAt"
      FROM "Sequences" s
      LEFT JOIN "Users" author on s."userId" = author."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<SearchSequence> {
    return this.getRawDb().one(`
      -- SequencesRepo.getSearchDocumentById
      ${this.getSearchDocumentQuery()}
      WHERE s."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchSequence[]> {
    return this.getRawDb().any(`
      -- SequencesRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      ORDER BY s."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Sequences"`);
    return count;
  }

  /**
   * The total number of posts for the sequences with the given ids, returned in the same order as the ids.
   */
  async postsCount(sequenceIds: string[]): Promise<number[]> {
    const query = `
      -- SequencesRepo.postsCount
      SELECT
        s._id as _id,
        count(*) as total_count
      FROM
        "Sequences" s
        LEFT JOIN "Chapters" c ON s._id = c."sequenceId"
        INNER JOIN "Posts" p ON p._id = ANY(c."postIds") AND (${getViewablePostsSelector("p")})
      WHERE
        s._id = ANY($1)
      GROUP BY s._id
    `;
  
    const results = await this.getRawDb().any<{_id: string, total_count: string}>(query, [sequenceIds]);
    const resultsById = keyBy(results, '_id')
    return sequenceIds.map(id => {
      const result = resultsById[id];
      return result ? parseInt(result.total_count, 10) : 0;
    })
  }

  /**
   * The number of read posts for the given (sequenceId, userId) combinations, returned in the order given.
   */
  async readPostsCount(params: { sequenceId: string; userId: string }[]): Promise<number[]> {
    const sequenceIds = params.map(p => p.sequenceId);
    const userIds = params.map(p => p.userId);
  
    const query = `
      -- SequencesRepo.readPostsCount
      SELECT
        s._id || '-' || rs."userId" as composite_id,
        count(*) AS read_count
      FROM
        "Sequences" s
        LEFT JOIN "Chapters" c ON s._id = c."sequenceId"
        INNER JOIN "ReadStatuses" rs ON rs."userId" = ANY($2) AND rs."postId" = ANY(c."postIds") AND rs."isRead" = TRUE
        INNER JOIN "Posts" p ON p._id = rs."postId" AND (${getViewablePostsSelector("p")})
      WHERE
        s._id = ANY($1)
      GROUP BY composite_id
    `;
  
    const results = await this.getRawDb().any<{ composite_id: string, read_count: string }>(query, [sequenceIds, userIds]);
    const resultsById = keyBy(results, 'composite_id');
  
    return params.map(param => {
      const compositeId = `${param.sequenceId}-${param.userId}`;
      const result = resultsById[compositeId];
      return result ? parseInt(result.read_count, 10) : 0
    });
  }

  /**
   * Title-substring search over the /library redesign's all-sequences list.
   * The WHERE conditions (other than the title match) must stay in sync with
   * the librarySequences view in lib/collections/sequences/views.ts.
   */
  async searchLibrarySequences({query, libraryTopics, curatedOnly, sortBy, limit}: {
    query: string,
    libraryTopics: string[] | null,
    curatedOnly: boolean,
    sortBy: string | null,
    limit: number,
  }): Promise<DbSequence[]> {
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    const topicTagSlugs = libraryTopics?.length
      ? libraryTopics.filter(isLibraryTopic).map(topic => LIBRARY_TOPIC_TAG_SLUGS[topic])
      : null;
    // Bake-off ranking sorts (librarySortOptions.ts) join a computed
    // scores CTE; the two base sorts order on Sequences columns directly.
    const ranking = getLibraryRankingSql(sortBy);
    const orderBy = ranking
      ? `${ranking.orderBy}, s."createdAt" DESC`
      : sortBy === "newest"
        ? `s."createdAt" DESC`
        : `s."curatedOrder" DESC NULLS LAST, s."createdAt" DESC`;
    return this.any(`
      -- SequencesRepo.searchLibrarySequences
      ${ranking ? `WITH ${LIBRARY_RANKING_SHARED_CTES}, ${ranking.ctes}` : ""}
      SELECT s.*
      FROM "Sequences" s
      ${ranking ? `LEFT JOIN scores ON scores."sequenceId" = s."_id"` : ""}
      WHERE s."title" ILIKE $(pattern)
        AND s."isDeleted" IS NOT TRUE
        AND s."draft" IS NOT TRUE
        AND s."hidden" IS NOT TRUE
        AND ($(topicTagSlugs) IS NULL OR s."_id" IN (
          SELECT c."sequenceId"
          FROM "Chapters" c
          CROSS JOIN LATERAL UNNEST(c."postIds") AS pid(post_id)
          JOIN "Posts" p ON p."_id" = pid.post_id
          CROSS JOIN (
            SELECT t."_id" FROM "Tags" t
            WHERE t."slug" = ANY($(topicTagSlugs)) AND t."deleted" IS NOT TRUE
          ) tag
          GROUP BY c."sequenceId", tag."_id"
          HAVING COUNT(*) FILTER (WHERE COALESCE((p."tagRelevance"->>tag."_id")::INTEGER, 0) >= 1) > 0
             AND COUNT(*) FILTER (WHERE COALESCE((p."tagRelevance"->>tag."_id")::INTEGER, 0) >= 1) * 2 >= COUNT(*)
        ))
        AND ($(curatedOnly) IS NOT TRUE OR s."curatedOrder" IS NOT NULL)
      ORDER BY ${orderBy}
      LIMIT $(limit)
    `, {pattern, topicTagSlugs, curatedOnly, limit});
  }

  /**
   * Topics a sequence holds, derived from its posts' tags — non-SQL fallback
   * for the libraryTopics field resolver. Ordered by number of matching
   * posts, dominant topic first.
   */
  async getDerivedLibraryTopics(sequenceId: string): Promise<string[]> {
    const rows = await this.getRawDb().any<{topic: string}>(`
      -- SequencesRepo.getDerivedLibraryTopics
      SELECT matches.topic
      FROM (
        SELECT
          topic.name AS topic,
          COUNT(p."_id") AS total,
          COUNT(p."_id") FILTER (WHERE COALESCE((p."tagRelevance"->>tag."_id")::INTEGER, 0) >= 1) AS matched
        FROM UNNEST($(topicNames)::TEXT[], $(topicSlugs)::TEXT[]) AS topic(name, slug)
        JOIN "Tags" tag ON tag."slug" = topic.slug AND tag."deleted" IS NOT TRUE
        LEFT JOIN "Chapters" c ON c."sequenceId" = $(sequenceId)
        LEFT JOIN LATERAL UNNEST(c."postIds") AS pid(post_id) ON TRUE
        LEFT JOIN "Posts" p ON p."_id" = pid.post_id
        GROUP BY topic.name
      ) matches
      WHERE matches.matched > 0 AND matches.matched * 2 >= matches.total
      ORDER BY matches.matched DESC, matches.topic
    `, {
      sequenceId,
      topicNames: [...LIBRARY_TOPICS],
      topicSlugs: LIBRARY_TOPICS.map(topic => LIBRARY_TOPIC_TAG_SLUGS[topic]),
    });
    return rows.map(row => row.topic);
  }

  /**
   * Static per-topic totals for the /library tag filter popover, over the same
   * set of sequences as the librarySequences view, using the same derived
   * topic definition as searchLibrarySequences.
   */
  async libraryTopicCounts(): Promise<{topic: string, count: number}[]> {
    return this.getRawDb().any(`
      -- SequencesRepo.libraryTopicCounts
      SELECT topic.name AS topic, COUNT(*)::INTEGER AS count
      FROM (
        SELECT
          c."sequenceId",
          tag."slug",
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE COALESCE((p."tagRelevance"->>tag."_id")::INTEGER, 0) >= 1) AS matched
        FROM "Chapters" c
        JOIN "Sequences" s ON s."_id" = c."sequenceId"
          AND s."isDeleted" IS NOT TRUE
          AND s."draft" IS NOT TRUE
          AND s."hidden" IS NOT TRUE
        CROSS JOIN LATERAL UNNEST(c."postIds") AS pid(post_id)
        JOIN "Posts" p ON p."_id" = pid.post_id
        CROSS JOIN (
          SELECT t."_id", t."slug" FROM "Tags" t
          WHERE t."slug" = ANY($(topicSlugs)) AND t."deleted" IS NOT TRUE
        ) tag
        GROUP BY c."sequenceId", tag."_id", tag."slug"
      ) per_sequence_topic
      JOIN UNNEST($(topicNames)::TEXT[], $(topicSlugs)::TEXT[]) AS topic(name, slug)
        ON topic.slug = per_sequence_topic."slug"
      WHERE per_sequence_topic.matched > 0
        AND per_sequence_topic.matched * 2 >= per_sequence_topic.total
      GROUP BY topic.name
    `, {
      topicNames: [...LIBRARY_TOPICS],
      topicSlugs: LIBRARY_TOPICS.map(topic => LIBRARY_TOPIC_TAG_SLUGS[topic]),
    });
  }

  async getSequenceWordCountAndReadTime(sequenceId: string): Promise<{ totalWordCount: number, totalReadTime: number }> {
    const result = await this.getRawDb().oneOrNone<{ totalWordCount: number, totalReadTime: number }>(`
      -- SequencesRepo.getSequenceWordCountAndReadTime
      SELECT
        COALESCE(SUM(r."wordCount"), 0) as "totalWordCount",
        COALESCE(SUM(
          CASE
            WHEN p."readTimeMinutesOverride" IS NOT NULL THEN GREATEST(1, ROUND(p."readTimeMinutesOverride"))
            ELSE GREATEST(1, ROUND(COALESCE(r."wordCount", 0) / $(readWordsPerMinute)))
          END
        ), 0) as "totalReadTime"
      FROM "Sequences" s
      JOIN "Chapters" c ON c."sequenceId" = s."_id"
      CROSS JOIN UNNEST(c."postIds") AS post_id
      JOIN "Posts" p ON p."_id" = post_id
      JOIN "Revisions" r ON r."_id" = p."contents_latest"
      WHERE s."_id" = $(sequenceId)
      AND ${getViewablePostsSelector("p")}
    `, {
      sequenceId,
      readWordsPerMinute: READ_WORDS_PER_MINUTE,
    });

    return {
      totalWordCount: result?.totalWordCount ?? 0,
      totalReadTime: result?.totalReadTime ?? 0,
    };
  }
}

recordPerfMetrics(SequencesRepo);

export default SequencesRepo;
