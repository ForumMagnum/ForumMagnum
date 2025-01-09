import AbstractRepo from "./AbstractRepo";
import Tags from "../../lib/collections/tags/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { getViewableTagsSelector } from "./helpers";

class TagsRepo extends AbstractRepo<"Tags"> {
  constructor() {
    super(Tags);
  }

  async tagRouteWillDefinitelyReturn200(slug: string): Promise<boolean> {
    const res = await this.getRawDb().oneOrNone<{exists: boolean}>(`
      -- SequencesRepo.sequenceRouteWillDefinitelyReturn200
      SELECT EXISTS(
        SELECT 1
        FROM "Tags"
        WHERE "slug" = $1 AND ${getViewableTagsSelector()}
      )
    `, [slug]);

    return res?.exists ?? false;
  }


  private getSearchDocumentQuery(): string {
    return `
      -- TagsRepo.getSearchDocumentQuery
      SELECT
        t."_id",
        t."_id" AS "objectID",
        t."name",
        t."slug",
        COALESCE(t."core", FALSE) AS "core",
        EXTRACT(EPOCH FROM t."createdAt") * 1000 AS "publicDateMs",
        COALESCE(t."defaultOrder", 0) AS "defaultOrder",
        COALESCE(t."suggestedAsFilter", FALSE) AS "suggestedAsFilter",
        COALESCE(t."postCount", 0) AS "postCount",
        COALESCE(t."wikiOnly", FALSE) AS "wikiOnly",
        COALESCE(t."adminOnly", FALSE) AS "adminOnly",
        COALESCE(t."deleted", FALSE) AS "deleted",
        COALESCE(t."isSubforum", FALSE) AS "isSubforum",
        t."bannerImageId",
        t."parentTagId",
        t."description"->>'html' AS "description",
        NOW() AS "exportedAt"
      FROM "Tags" t
    `;
  }

  getSearchDocumentById(id: string): Promise<SearchTag> {
    return this.getRawDb().one(`
      -- TagsRepo.getSearchDocumentById
      ${this.getSearchDocumentQuery()}
      WHERE t."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchTag[]> {
    return this.getRawDb().any(`
      -- TagsRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      ORDER BY t."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Tags"`);
    return count;
  }

  async getTagWithSummaries(slug: string) {
    return this.getRawDb().oneOrNone<DbTag & { summaries: DbMultiDocument[] }>(`
      -- TagsRepo.getTagWithSummaries
      WITH matching_tags AS (
        -- Get tags that directly match the slug
        SELECT
          t.*,
          t.slug,
          t.description,
          NULL as md_id
        FROM "Tags" t
        WHERE t.deleted IS FALSE
        AND (t."slug" = $1 OR t."oldSlugs" @> ARRAY[$1])
        
        UNION ALL
        
        -- Get tags that have a lens matching the slug
        SELECT
          t.*,
          md.slug AS "slug",
          TO_JSONB(r.*) AS "description",
          md._id as md_id
        FROM "MultiDocuments" md
        JOIN "Tags" t
        ON t."_id" = md."parentDocumentId"
        LEFT JOIN "Revisions" r
        ON r."_id" = md."contents_latest"
        WHERE t.deleted IS FALSE
        AND (
          md."slug" = $1
          OR md."oldSlugs" @> ARRAY[$1]
        )
        AND md."collectionName" = 'Tags'
        AND md."fieldName" = 'description'
      )
      SELECT DISTINCT ON (t._id)
        t.*,
        ARRAY_AGG(TO_JSONB(md.*)) OVER (PARTITION BY t._id) as summaries
      FROM matching_tags t
      LEFT JOIN "MultiDocuments" md
      ON (
        md."parentDocumentId" = COALESCE(t.md_id, t._id)
        AND md."fieldName" = 'summary'
      )
      -- TODO: figure out a more principled fix for the problem we can have multiple tags or lenses with the same slug/oldSlugs
      LIMIT 1
    `, [slug]);
  }

  async getAllTagsForCache(): Promise<(DbTag & { coreTagId: string, summaries: DbMultiDocument[] })[]> {
    return this.getRawDb().any(`
      -- TagsRepo.getAllTagsForCache
      WITH core_tag_ids AS (
        SELECT _id
        FROM "Tags"
        WHERE core IS TRUE
      )
      SELECT
        t_child.*,
        (ARRAY_AGG(t_parent."_id") FILTER (WHERE t_parent._id IN (SELECT _id FROM core_tag_ids)))[1] AS "coreTagId"
      FROM "Tags" t_child
      LEFT JOIN "ArbitalTagContentRels" acr
      ON t_child._id = acr."childDocumentId"
      LEFT JOIN core_tag_ids t_parent
      ON t_parent._id = acr."parentDocumentId"
      WHERE t_child.deleted IS FALSE
      AND t_child."isPlaceholderPage" IS FALSE
      AND (
        acr IS NULL
        OR (
          acr."parentCollectionName" = 'Tags'
          AND acr."type" = 'parent-is-tag-of-child'
        )
      )
      GROUP BY t_child._id
    `);
  }

  async getTagSpeeds() {
    return this.getRawDb().any<{ _id: string, slug: string, tagIdsWithSpeed: string[] }>(`
      -- TagsRepo.getTagSpeeds
      SELECT t._id, t.slug, ARRAY_AGG(acr."childDocumentId") AS "tagIdsWithSpeed"
      FROM "Tags" t
      JOIN "ArbitalTagContentRels" acr
      ON t._id = acr."parentDocumentId" AND acr.type = 'parent-is-tag-of-child'
      WHERE t.slug IN ('low-speed-explanation', 'high-speed-explanation')
      GROUP BY t._id, t.slug
    `);
  }

  async getTagSubjectSiblingRelationships(tagId: string) {
    return this.getRawDb().any<{
      sourceTagId: string,
      subjectTagId: string,
      level: number,
      relationships: { tagId: string, level: number }[]
    }>(`
      -- TagsRepo.getTagSubjectSiblingRelationships
      SELECT
        source_tag_subject_rels."parentDocumentId" AS "subjectTagId",
        source_tag_subject_rels."level",
        ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'tagId', target_tag_subject_rels."childDocumentId",
            'level', target_tag_subject_rels."level"
          )
        ) AS "relationships"
      FROM "Tags" source_tag
      JOIN "ArbitalTagContentRels" source_tag_subject_rels
      ON (
        source_tag._id = source_tag_subject_rels."childDocumentId"
        AND source_tag_subject_rels.type = 'parent-taught-by-child'
        AND source_tag_subject_rels."isStrong" IS TRUE
      )
      JOIN "ArbitalTagContentRels" target_tag_subject_rels
      ON (
        target_tag_subject_rels."parentDocumentId" = source_tag_subject_rels."parentDocumentId"
        AND target_tag_subject_rels.type = 'parent-taught-by-child'
        AND target_tag_subject_rels."isStrong" IS TRUE
      )
      WHERE source_tag._id = $1
      AND target_tag_subject_rels."childDocumentId" != $1
      GROUP BY source_tag_subject_rels."parentDocumentId", source_tag_subject_rels."level"
    `, [tagId]);
  }

  /**
   * Fetch tags by parent tag using ArbitalTagContentRels, with optional limit, offset, and searchTagIds
   */
  async getTagsByParentTagId(
    parentTagId: string | null,
    limit: number,
    searchTagIds?: string[]
  ): Promise<{ tags: DbTag[]; totalCount: number }> {
    const whereClauses: string[] = [];
    const queryParams: Record<string, SqlQueryArg> = {
      limit,
    };

    // Base condition: only select non-deleted tags
    whereClauses.push(
      `t_child."deleted" IS FALSE`,
      `t_child."isPlaceholderPage" IS FALSE`,
    );

    if (parentTagId !== null) {
      // Fetch tags that are children of the specified parent tag
      queryParams.parentTagId = parentTagId;
      whereClauses.push(
        `acr."parentDocumentId" = $(parentTagId)`,
        `acr."type" = 'parent-is-tag-of-child'`,
        `acr."parentCollectionName" = 'Tags'`,
        `acr."childCollectionName" = 'Tags'`
      );
    } else {
      // Fetch tags that do NOT have a parent tag
      whereClauses.push(
        `acr."parentDocumentId" IS NULL`,
        `acr."type" IS NULL`,
      );
    }

    if (searchTagIds && searchTagIds.length > 0) {
      queryParams.searchTagIds = searchTagIds;
      whereClauses.push(`t_child."_id" = ANY($(searchTagIds))`);
    }

    const query = `
      -- TagsRepo.getTagsByParentTagId
      SELECT
        t_child.*,
        COUNT(*) OVER() AS "totalCount"
      FROM "Tags" t_child
      LEFT JOIN "ArbitalTagContentRels" acr
        ON t_child."_id" = acr."childDocumentId"
        AND acr."type" = 'parent-is-tag-of-child'
        AND acr."parentCollectionName" = 'Tags'
        AND acr."childCollectionName" = 'Tags'
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      ORDER BY t_child."baseScore" DESC, t_child."name" ASC
      LIMIT $(limit)
    `;

    const tags = await this.getRawDb().any(query, queryParams);

    const totalCount = tags.length > 0 ? parseInt(tags[0].totalCount, 10) : 0;

    // Remove the totalCount from individual tag objects
    tags.forEach(tag => delete tag.totalCount);

    return { tags, totalCount };
  }
}

recordPerfMetrics(TagsRepo);

export default TagsRepo;
