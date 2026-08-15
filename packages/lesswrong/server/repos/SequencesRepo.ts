import AbstractRepo from "./AbstractRepo";
import Sequences from "../../server/collections/sequences/collection";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import uniq from "lodash/uniq";
import { getViewablePostsSelector, getViewableSequencesSelector } from "./helpers";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { READ_WORDS_PER_MINUTE, postStatuses } from "@/lib/collections/posts/constants";
import { LIBRARY_TOPICS, LIBRARY_TOPIC_TAG_SLUGS, LIBRARY_CORE_TAG_NAMES, FICTION_TAG_SLUG } from "@/lib/collections/sequences/libraryTopics";
import { LIBRARY_RANKING_SHARED_CTES, getLibraryRankingSql, getLibraryRankingParams } from "./librarySequenceRankingSql";

// Derived sequence tags (getDerivedTags), per the "Sequence tags resolved
// from post tags" handoff, amended so Fiction is simply an eighth core tag
// rather than absolute-precedence: each post's effective core tags are its
// direct core tags, the coreTagId rollups of its specific tags, and Fiction
// when the post is tagged Fiction (a tag applies to a post via TagRels: not
// deleted, score > 0). Sequence-level selection over its published,
// chapter-deduped posts:
//  - core tags: coverage >= 50% (cap 3); if none, fall back to core tags
//    with coverage >= 60% of the top core tag's coverage and support of at
//    least 2 posts (1 if the sequence has < 4 posts), cap 3;
//  - topic labels: specific (non-core) tags with coverage >= 60%, cap 2,
//    Fiction never eligible as a label.
const CORE_COVERAGE_THRESHOLD = 0.5;
const CORE_FALLBACK_RELATIVE_THRESHOLD = 0.6;
const CORE_FALLBACK_MIN_SUPPORT_SMALL_SEQUENCE = 4;
const MAX_CORE_TAGS = 3;
const LABEL_COVERAGE_THRESHOLD = 0.6;
const MAX_LABEL_TAGS = 2;

interface SequencePostTagRow {
  postId: string;
  tagId: string | null;
  slug: string | null;
  core: boolean | null;
  coreTagId: string | null;
}

interface TagCoverage {
  tagId: string;
  support: number;
  coverage: number;
}

// Returns the selected tag ids in display order: core tags first, then topic
// labels, each by descending coverage (ties by tag id for determinism).
function computeDerivedSequenceTagIds(rows: SequencePostTagRow[]): string[] {
  const tagsByPost = new Map<string, SequencePostTagRow[]>();
  for (const row of rows) {
    const postRows = tagsByPost.get(row.postId) ?? [];
    if (row.tagId) {
      postRows.push(row);
    }
    tagsByPost.set(row.postId, postRows);
  }
  const totalPosts = tagsByPost.size;
  if (totalPosts === 0) {
    return [];
  }

  const coreSupport = new Map<string, number>();
  const labelSupport = new Map<string, number>();
  for (const postRows of tagsByPost.values()) {
    const effectiveCore = new Set<string>();
    for (const row of postRows) {
      if (row.tagId && (row.core || row.slug === FICTION_TAG_SLUG)) {
        effectiveCore.add(row.tagId);
      }
      if (!row.core && row.slug !== FICTION_TAG_SLUG && row.coreTagId) {
        effectiveCore.add(row.coreTagId);
      }
    }
    for (const tagId of effectiveCore) {
      coreSupport.set(tagId, (coreSupport.get(tagId) ?? 0) + 1);
    }
    for (const row of postRows) {
      if (row.tagId && !row.core && row.slug !== FICTION_TAG_SLUG) {
        labelSupport.set(row.tagId, (labelSupport.get(row.tagId) ?? 0) + 1);
      }
    }
  }

  const toCoverages = (support: Map<string, number>): TagCoverage[] =>
    [...support.entries()]
      .map(([tagId, count]) => ({ tagId, support: count, coverage: count / totalPosts }))
      .sort((a, b) => b.coverage - a.coverage || a.tagId.localeCompare(b.tagId));

  const coreCoverages = toCoverages(coreSupport);
  let coreTags = coreCoverages.filter(entry => entry.coverage >= CORE_COVERAGE_THRESHOLD);
  if (coreTags.length === 0 && coreCoverages.length > 0) {
    const topCoverage = coreCoverages[0].coverage;
    const minSupport = totalPosts < CORE_FALLBACK_MIN_SUPPORT_SMALL_SEQUENCE ? 1 : 2;
    coreTags = coreCoverages.filter(entry =>
      entry.coverage >= CORE_FALLBACK_RELATIVE_THRESHOLD * topCoverage && entry.support >= minSupport
    );
  }
  const labelTags = toCoverages(labelSupport).filter(entry => entry.coverage >= LABEL_COVERAGE_THRESHOLD);

  return [
    ...coreTags.slice(0, MAX_CORE_TAGS),
    ...labelTags.slice(0, MAX_LABEL_TAGS),
  ].map(entry => entry.tagId);
}

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
  async searchLibrarySequences({query, curatedOnly, sortBy, limit}: {
    query: string,
    curatedOnly: boolean,
    sortBy: string | null,
    limit: number,
  }): Promise<DbSequence[]> {
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    // Bake-off ranking sorts (librarySortOptions.ts) join a computed
    // scores CTE; the two base sorts order on Sequences columns directly.
    const ranking = getLibraryRankingSql(sortBy);
    const rankingParams = ranking ? await getLibraryRankingParams(sortBy) : {};
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
        AND ($(curatedOnly) IS NOT TRUE OR s."curatedOrder" IS NOT NULL)
      ORDER BY ${orderBy}
      LIMIT $(limit)
    `, {...rankingParams, pattern, curatedOnly, limit});
  }

  /**
   * The tags each sequence holds, derived from its posts' tags for the
   * libraryTags field resolver, per the recipe documented above
   * computeDerivedSequenceTagIds: up to 3 core tags followed by up to 2
   * specific topic labels. Batched (the result is aligned with sequenceIds)
   * so the field can be loaded for a whole list of rows via a DataLoader.
   */
  async getDerivedTags(sequenceIds: string[]): Promise<DbTag[][]> {
    if (sequenceIds.length === 0) {
      return [];
    }
    const rows = await this.getRawDb().any<SequencePostTagRow & {sequenceId: string}>(`
      -- SequencesRepo.getDerivedTags
      WITH sequence_posts AS (
        SELECT DISTINCT c."sequenceId" AS sequence_id, pid.post_id
        FROM "Chapters" c
        JOIN LATERAL UNNEST(c."postIds") AS pid(post_id) ON TRUE
        WHERE c."sequenceId" = ANY($(sequenceIds)::TEXT[])
      )
      SELECT
        sp.sequence_id AS "sequenceId",
        p."_id" AS "postId",
        tag."_id" AS "tagId",
        tag."slug",
        tag."core",
        tag."coreTagId"
      FROM sequence_posts sp
      JOIN "Posts" p ON p."_id" = sp.post_id
        AND p."draft" IS NOT TRUE
        AND p."status" = $(statusApproved)
      LEFT JOIN "TagRels" tr ON tr."postId" = p."_id"
        AND tr."deleted" IS NOT TRUE
        AND tr."score" > 0
      LEFT JOIN "Tags" tag ON tag."_id" = tr."tagId"
        AND tag."deleted" IS NOT TRUE
        AND tag."adminOnly" IS NOT TRUE
    `, { sequenceIds, statusApproved: postStatuses.STATUS_APPROVED });

    const rowsBySequence = groupBy(rows, row => row.sequenceId);
    const tagIdsBySequence = sequenceIds.map(sequenceId =>
      computeDerivedSequenceTagIds(rowsBySequence[sequenceId] ?? []));
    const allTagIds = uniq(tagIdsBySequence.flat());
    if (allTagIds.length === 0) {
      return sequenceIds.map(() => []);
    }
    const tags = await this.getRawDb().any<DbTag>(`
      -- SequencesRepo.getDerivedTags (fetch selected tags)
      SELECT * FROM "Tags" WHERE "_id" = ANY($(allTagIds)::TEXT[]) AND "deleted" IS NOT TRUE
    `, { allTagIds });
    const tagsById = keyBy(tags, tag => tag._id);
    return tagIdsBySequence.map(tagIds => tagIds.map(tagId => tagsById[tagId]).filter(tag => !!tag));
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
    const sequenceRows = await this.getRawDb().any<{_id: string}>(`
      -- SequencesRepo.libraryTopicCounts
      SELECT s."_id"
      FROM "Sequences" s
      WHERE s."isDeleted" IS NOT TRUE
        AND s."draft" IS NOT TRUE
        AND s."hidden" IS NOT TRUE
    `);
    const derivedTags = await this.getDerivedTags(sequenceRows.map(row => row._id));
    const counts = new Map<string, number>();
    for (const tags of derivedTags) {
      for (const tag of tags) {
        counts.set(tag.name ?? '', (counts.get(tag.name ?? '') ?? 0) + 1);
      }
    }
    return [...LIBRARY_CORE_TAG_NAMES].map(topic => ({ topic, count: counts.get(topic) ?? 0 }));
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
