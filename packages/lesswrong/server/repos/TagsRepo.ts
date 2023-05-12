import AbstractRepo from "./AbstractRepo";
import Tags from "../../lib/collections/tags/collection";

export default class TagsRepo extends AbstractRepo<DbTag> {
  constructor() {
    super(Tags);
  }

  getSearchDocuments(
    limit: number,
    offset: number,
  ): Promise<AlgoliaTag[]> {
    return this.getRawDb().any(`
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
        COALESCE(t."isSubforum", FALSE) AS "isSubforum",
        t."bannerImageId",
        t."parentTagId",
        fm_strip_html(t."description"->>'html') AS "description"
      FROM "Tags" t
      WHERE
        t."deleted" IS NOT TRUE AND
        t."adminOnly" IS NOT TRUE
      ORDER BY t."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const result = await this.getRawDb().one(`
      SELECT COUNT(*)
      FROM "Tags" t
      WHERE
        t."deleted" IS NOT TRUE AND
        t."adminOnly" IS NOT TRUE
    `);
    return result.count;
  }
}
