import Comments from "../../lib/collections/comments/collection";
import AbstractRepo from "./AbstractRepo";
import SelectQuery from "../../lib/sql/SelectQuery";
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';

export default class CommentsRepo extends AbstractRepo<DbComment> {
  constructor() {
    super(Comments);
  }

  async getPromotedCommentsOnPosts(postIds: string[]): Promise<(DbComment|null)[]> {
    const comments = await this.manyOrNone(`
      SELECT c.*
      FROM "Comments" c
      JOIN (
          SELECT "postId", MAX("promotedAt") AS max_promotedAt
          FROM "Comments"
          WHERE "postId" IN ($1:csv)
          GROUP BY "postId"
      ) sq
      ON c."postId" = sq."postId" AND c."promotedAt" = sq.max_promotedAt;
    `, [postIds]);
    
    const commentsByPost = keyBy(comments, c=>c.postId);
    return postIds.map(postId => commentsByPost[postId] ?? null);
  }

  async getRecentCommentsOnPosts(postIds: string[], limit: number, filter: MongoSelector<DbComment>): Promise<DbComment[][]> {
    const selectQuery = new SelectQuery(this.getCollection().table, filter)
    const selectQueryAtoms = selectQuery.compileSelector(filter);
    const {sql: filterWhereClause, args: filterArgs} = selectQuery.compileAtoms(selectQueryAtoms, 2);

    const comments = await this.manyOrNone(`
      WITH cte AS (
        SELECT
          comment_with_rownumber.*,
          ROW_NUMBER() OVER (PARTITION BY comment_with_rownumber."postId" ORDER BY comment_with_rownumber."postedAt" DESC) as rn
        FROM "Comments" comment_with_rownumber
        WHERE comment_with_rownumber."postId" IN ($1:csv)
        AND (
          ${filterWhereClause}
        )
      )
      SELECT *
      FROM cte
      WHERE rn <= $2
    `, [postIds, limit, ...filterArgs]);
    
    const commentsByPost = groupBy(comments, c=>c.postId);
    return postIds.map(postId =>
      orderBy(
        commentsByPost[postId] ?? [],
        c => -c.postedAt.getTime()
      )
    );
  }
  
  async getCommentsWithReacts(limit: number): Promise<(DbComment|null)[]> {
    return await this.manyOrNone(`
      SELECT c.*
      FROM "Comments" c
      JOIN (
          SELECT "documentId", MIN("votedAt") AS most_recent_react
          FROM "Votes"
          WHERE "collectionName" = 'Comments' AND "extendedVoteType"->'reacts' != '[]'::jsonb
          GROUP BY "documentId"
          ORDER BY most_recent_react DESC
          LIMIT $1
      ) v
      ON c._id = v."documentId"
      ORDER BY v.most_recent_react DESC;
    `, [limit]);
  }

  async getPopularComments({minScore = 15, offset = 0, limit = 3}: {
    offset?: number,
    limit?: number,
    minScore?: number,
  }): Promise<DbComment[]> {
    return this.any(`
      SELECT c.*
      FROM (
        SELECT DISTINCT ON ("postId")
          "_id",
          fm_comment_confidence("_id", 3) AS "confidence"
        FROM "Comments"
        WHERE
          CURRENT_TIMESTAMP - "postedAt" < '1 week'::INTERVAL AND
          "shortform" IS NOT TRUE AND
          "baseScore" >= $1 AND
          "retracted" IS NOT TRUE AND
          "deleted" IS NOT TRUE AND
          "deletedPublic" IS NOT TRUE AND
          "needsReview" IS NOT TRUE
        ORDER BY "postId", "confidence" DESC
      ) q
      JOIN "Comments" c ON c."_id" = q."_id"
      ORDER BY q."confidence" DESC, c."createdAt" ASC
      OFFSET $2
      LIMIT $3
    `, [minScore, offset, limit]);
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
}
