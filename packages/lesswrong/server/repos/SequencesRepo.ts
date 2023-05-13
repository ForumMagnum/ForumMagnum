import AbstractRepo from "./AbstractRepo";
import Sequences from "../../lib/collections/sequences/collection";

export default class SequencesRepo extends AbstractRepo<DbSequence> {
  constructor() {
    super(Sequences);
  }

  private getSearchDocumentQuery(): string {
    return `
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
        author."displayName" AS "authorDisplayName",
        author."username" AS "authorUserName",
        author."slug" AS "authorSlug",
        s."contents"->>'html' AS "plaintextDescription"
      FROM "Sequences" s
      LEFT JOIN "Users" author on s."userId" = author."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaSequence> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE p."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaSequence[]> {
    return this.getRawDb().any(`
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
}
