import AbstractRepo from "./AbstractRepo";
import Tags from "../../server/collections/tags/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { getViewableTagsSelector } from "./helpers";
import { MultiDocuments } from "@/server/collections/multiDocuments/collection";
import sortBy from "lodash/sortBy";

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
        COALESCE(t."baseScore", 0) AS "baseScore",
        COALESCE(t."postCount", 0) AS "postCount",
        COALESCE(t."wikiOnly", FALSE) AS "wikiOnly",
        COALESCE(t."adminOnly", FALSE) AS "adminOnly",
        COALESCE(t."deleted", FALSE) AS "deleted",
        COALESCE(t."isSubforum", FALSE) AS "isSubforum",
        t."isPlaceholderPage" AS "isPlaceholderPage",
        t."bannerImageId",
        t."parentTagId",
        t."description"->>'html' AS "description",
        NOW() AS "exportedAt"
      FROM "Tags" t
    `;
  }

  async getSearchDocumentById(id: string): Promise<SearchTag> {
    const result = await this.getRawDb().one(`
      -- TagsRepo.getSearchDocumentById
      ${this.getSearchDocumentQuery()}
      WHERE t."_id" = $1
    `, [id]);
    
    return this.addLensesToDescription(result);
  }

  async getSearchDocuments(limit: number, offset: number): Promise<SearchTag[]> {
    const results = await this.getRawDb().any(`
      -- TagsRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      ORDER BY t."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
    
    return Promise.all(results.map(result => this.addLensesToDescription(result)));
  }
  
  private async addLensesToDescription(searchResult: SearchTag): Promise<SearchTag> {
    const lenses = await MultiDocuments.find({
      parentDocumentId: searchResult._id,
      fieldName: "description",
      deleted: false,
    }).fetch();
    const sortedLenses = sortBy(lenses, l=>l.index);
    
    const lensDescriptions: string[] = [
      searchResult.description,
      ...await Promise.all(sortedLenses.map(lens => this.lensToSearchDocumentHtml(lens)))
    ]
    const descriptionWithLenses = '<div>' + lensDescriptions.join("\n\n") + '</div>';
    return {
      ...searchResult,
      description: descriptionWithLenses
    };
  }
  
  private async lensToSearchDocumentHtml(lens: DbMultiDocument): Promise<string> {
    const contentsRevId = lens.contents_latest
    if (!contentsRevId) return "";
    const contentsRev = await this.getRawDb().oneOrNone<DbRevision>(`
      -- TagsRepo.lensToSearchDocumentHtml
      SELECT * FROM "Revisions" WHERE "_id" = $1
    `, [contentsRevId]);
    if (!contentsRev) return "";
    return `<h2>${lens.tabTitle}${lens.tabSubtitle ? (": "+lens.tabSubtitle) : ""}</h2>${contentsRev.html}`;
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Tags"`);
    return count;
  }

  async getTagWithSummaries(slug: string) {
    return this.getRawDb().oneOrNone<DbTag & { lens: DbMultiDocument | null, summaries: DbMultiDocument[] }>(`
      -- TagsRepo.getTagWithSummaries
      WITH matching_tags AS (
        -- Get tags that directly match the slug
        SELECT
          t.*,
          NULL AS lens,
          NULL AS md_id
        FROM "Tags" t
        WHERE t.deleted IS FALSE
        AND (t."slug" = $1 OR t."oldSlugs" @> ARRAY[$1])
        
        UNION ALL
        
        -- Get tags that have a lens matching the slug
        SELECT
          t.*,
          TO_JSONB(md.*) AS lens,
          md._id AS md_id
        FROM "MultiDocuments" md
        JOIN "Tags" t
        ON t."_id" = md."parentDocumentId"
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
        AND md."deleted" IS FALSE
      )
      -- In theory we shouldn't have more than one tag or lens with the same slug/oldSlugs, but if we did and didn't limit, the .oneOrNone would throw an error
      LIMIT 1
    `, [slug]);
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
   * Fetch tags by core tag, with optional limit and searchTagIds
   */
  async getTagsByCoreTagId(
    coreTagId: string | null,
    limit: number,
    searchTagIds?: string[]
  ): Promise<{ tags: DbTag[]; totalCount: number }> {
    const whereClauses: string[] = [];
    const queryParams: Record<string, SqlQueryArg> = {
      limit,
    };

    whereClauses.push(
      `t."deleted" IS FALSE`,
      `t."isPlaceholderPage" IS FALSE`,
      `t."core" IS NOT TRUE`,
    );

    if (coreTagId !== null) {
      queryParams.coreTagId = coreTagId;
      whereClauses.push(`t."coreTagId" = $(coreTagId)`);
    } else {
      whereClauses.push(`t."coreTagId" IS NULL`);
    }

    if (searchTagIds && searchTagIds.length > 0) {
      queryParams.searchTagIds = searchTagIds;
      whereClauses.push(`t."_id" = ANY($(searchTagIds))`);
    }

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    const query = `
      -- TagsRepo.getTagsByCoreTagId
      SELECT
        t.*,
        COUNT(*) OVER() AS "totalCount"
      FROM "Tags" t
      LEFT JOIN LATERAL (
        SELECT MAX(md."baseScore") AS "maxBaseScore"
        FROM "MultiDocuments" md
        WHERE md."parentDocumentId" = t."_id"
          AND md."collectionName" = 'Tags'
          AND md."fieldName" = 'description'
          AND md."deleted" IS FALSE
      ) md ON TRUE
      ${whereClause}
      ORDER BY
        GREATEST(
          t."baseScore",
          COALESCE(md."maxBaseScore", 0)
        ) DESC,
        t."name" ASC
      LIMIT $(limit)
    `;

    const tags = await this.getRawDb().any(query, queryParams);
    const totalCount = tags.length > 0 ? parseInt(tags[0].totalCount, 10) : 0;

    // Remove the totalCount from individual tag objects
    tags.forEach(tag => {delete tag.totalCount});

    return { tags, totalCount };
  }
}

recordPerfMetrics(TagsRepo);

export default TagsRepo;
