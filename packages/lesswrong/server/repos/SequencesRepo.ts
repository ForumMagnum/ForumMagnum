import AbstractRepo from "./AbstractRepo";
import Sequences from "../../lib/collections/sequences/collection";

export default class SequencesRepo extends AbstractRepo<DbSequence> {
  constructor() {
    super(Sequences);
  }

  async getSearchDocuments(
    limit: number,
    offset: number,
  ): Promise<AlgoliaSequence[]> {
    return this.getRawDb().any(`
      SELECT
        s."_id",
        s."_id" AS "objectID",
        s."title",
        s."userId",
        s."createdAt",
        EXTRACT(EPOCH FROM s."createdAt") * 1000 AS "publicDateMs",
        s."af",
        s."bannerImageId",
        author."displayName" AS "authorDisplayName",
        author."username" AS "authorUserName",
        author."slug" AS "authorSlug",
        fm_strip_html(s."contents"->>'html') AS "plaintextDescription"
      FROM "Sequences" s
      LEFT JOIN "Users" author on s."userId" = author."_id"
      WHERE
        s."isDeleted" IS NOT TRUE AND
        s."draft" IS NOT TRUE AND
        s."hidden" IS NOT TRUE
      ORDER BY s."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const result = await this.getRawDb().one(`
      SELECT COUNT(*)
      FROM "Sequences" s
      WHERE
        s."isDeleted" IS NOT TRUE AND
        s."draft" IS NOT TRUE AND
        s."hidden" IS NOT TRUE
    `);
    return result.count;
  }
}
