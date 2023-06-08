import AbstractRepo from "./AbstractRepo";
import Comments from "../../lib/collections/comments/collection";

export default class CommentsRepo extends AbstractRepo<DbComment> {
  constructor() {
    super(Comments);
  }

  private getSearchDocumentQuery(): string {
    return `
      SELECT
        c."_id",
        c."_id" AS "objectID",
        c."userId",
        COALESCE(c."baseScore", 0) AS "baseScore",
        COALESCE(c."deleted", FALSE) AS "deleted",
        COALESCE(c."rejected", FALSE) AS "rejected",
        COALESCE(c."authorIsUnreviewed", FALSE) AS "authorIsUnreviewed",
        COALESCE(c."retracted", FALSE) AS "retracted",
        COALESCE(c."spam", FALSE) AS "spam",
        c."legacy",
        c."createdAt",
        c."postedAt",
        EXTRACT(EPOCH FROM c."postedAt") * 1000 AS "publicDateMs",
        COALESCE(c."af", FALSE) AS "af",
        author."slug" AS "authorSlug",
        author."displayName" AS "authorDisplayName",
        author."username" AS "authorUserName",
        c."postId",
        post."title" AS "postTitle",
        post."slug" AS "postSlug",
        COALESCE(post."isEvent", FALSE) AS "postIsEvent",
        post."groupId" AS "postGroupId",
        fm_post_tag_ids(post."_id") AS "tags",
        CASE WHEN c."tagId" IS NULL
          THEN fm_post_tag_ids(post."_id")
          ELSE ARRAY(SELECT c."tagId")
        END AS "tags",
        c."tagId",
        tag."name" AS "tagName",
        tag."slug" AS "tagSlug",
        c."tagCommentType",
        c."contents"->>'html' AS "body",
        NOW() AS "exportedAt"
      FROM "Comments" c
      LEFT JOIN "Users" author ON c."userId" = author."_id"
      LEFT JOIN "Posts" post on c."postId" = post."_id"
      LEFT JOIN "Tags" tag on c."tagId" = tag."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaComment> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE c."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaComment[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      ORDER BY c."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Comments"`);
    return count;
  }

  async getPostCommentCount(postId: string): Promise<number> {
    const { count } = await this.getRawDb().one(`
      SELECT COUNT(*)
      FROM "Comments"
      WHERE "postId" = $1
      AND "deleted" IS NOT TRUE
      AND "rejected" IS NOT TRUE
      AND "debateResponse" IS NOT TRUE
    `, [postId]);
    return count;
  }
}
