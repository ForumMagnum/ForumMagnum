import AbstractRepo from "./AbstractRepo";
import Sequences from "../../lib/collections/sequences/collection";
import keyBy from "lodash/keyBy";
import { getViewablePostsSelector } from "./helpers";

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
        s."contents"->>'html' AS "plaintextDescription",
        NOW() AS "exportedAt"
      FROM "Sequences" s
      LEFT JOIN "Users" author on s."userId" = author."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaSequence> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE s."_id" = $1
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

  /**
   * The total number of posts for the sequences with the given ids, returned in the same order as the ids.
   */
  async postsCount(sequenceIds: string[]): Promise<number[]> {
    const query = `
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
   * The number of read posts for the given (sequenceId, userId) combinations, returned in the same order given.
   */
  async readPostsCount(params: { sequenceId: string; userId: string }[]): Promise<number[]> {
    const sequenceIds = params.map(p => p.sequenceId);
    const userIds = params.map(p => p.userId);
  
    const query = `
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
}
