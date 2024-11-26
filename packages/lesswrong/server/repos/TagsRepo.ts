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
          t.description
        FROM "Tags" t
        WHERE t."slug" = $1
        OR t."oldSlugs" @> ARRAY[$1]
        
        UNION ALL
        
        -- Get tags that have a lens matching the slug
        SELECT
          t.*,
          md.slug AS "slug",
          TO_JSONB(r.*) AS "description"
        FROM "MultiDocuments" md
        JOIN "Tags" t
        ON t."_id" = md."parentDocumentId"
        LEFT JOIN "Revisions" r
        ON r."_id" = md."contents_latest"
        WHERE (
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
      ON md."parentDocumentId" = t."_id"
      WHERE md IS NULL
      OR md."fieldName" = 'summary'
    `, [slug]);
  }
}

recordPerfMetrics(TagsRepo);

export default TagsRepo;
