import AbstractRepo from "./AbstractRepo";
import { UserLists } from "../../lib/collections/userLists/collection";

export default class UsersRepo extends AbstractRepo<DbUserList> {
  constructor() {
    super(UserLists);
  }

  private getSearchDocumentQuery(): string {
    return `
      SELECT
        u."_id",
        u."_id" AS "objectID",
        EXTRACT(EPOCH FROM u."createdAt") * 1000 AS "publicDateMs",
        u."name",
        u."description"->>'html' AS "description",
        u."deleted",
        u."isPublic",
        u."memberIds",
        u."userId",
        NOW() AS "exportedAt"
      FROM "UserLists" u
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaUserList> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE u."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaUserList[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      ORDER BY u."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "UserLists"`);
    return count;
  }
}
