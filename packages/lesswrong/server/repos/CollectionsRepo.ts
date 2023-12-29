import AbstractRepo from "./AbstractRepo";
import Collections from "../../lib/collections/collections/collection";
import keyBy from "lodash/keyBy";
import { getViewablePostsSelector } from "./helpers";
import { recordPerfMetrics } from "./perfMetricWrapper";

class CollectionsRepo extends AbstractRepo<"Collections"> {
  constructor() {
    super(Collections);
  }

  /**
   * The total number of posts for the collections with the given ids, returned in the same order as the ids.
   */
  async postsCount(collectionIds: string[]): Promise<number[]> {
    const query = `
      -- CollectionsRepo.postsCount
      SELECT
        cols._id as _id,
        count(*) as total_count
      FROM
        "Collections" cols
        LEFT JOIN "Books" b ON b."collectionId" = cols._id
        LEFT JOIN "Sequences" s ON s._id = ANY(b."sequenceIds")
        LEFT JOIN "Chapters" c ON s._id = c."sequenceId"
        INNER JOIN "Posts" p ON (p._id = ANY(c."postIds") OR p._id = ANY(b."postIds")) AND (${getViewablePostsSelector("p")})
      WHERE
        cols._id = ANY($1)
      GROUP BY cols._id
    `;
  
    const results = await this.getRawDb().any<{_id: string, total_count: string}>(query, [collectionIds]);
    const resultsById = keyBy(results, '_id');
    return collectionIds.map(id => {
      const result = resultsById[id];
      return result ? parseInt(result.total_count, 10) : 0;
    });
  }

  /**
   * The number of read posts for the given (collectionId, userId) combinations, returned in the order given.
   */
  async readPostsCount(params: { collectionId: string; userId: string }[]): Promise<number[]> {
    const collectionIds = params.map(p => p.collectionId);
    const userIds = params.map(p => p.userId);
  
    const query = `
      -- CollectionsRepo.postsCount
      SELECT
        cols._id || '-' || rs."userId" as composite_id,
        count(*) as read_count
      FROM
        "Collections" cols
        LEFT JOIN "Books" b ON b."collectionId" = cols._id
        LEFT JOIN "Sequences" s ON s._id = ANY(b."sequenceIds")
        LEFT JOIN "Chapters" c ON s._id = c."sequenceId"
        INNER JOIN "ReadStatuses" rs ON rs."userId" = ANY($2) AND (rs."postId" = ANY(c."postIds") OR rs."postId" = ANY(b."postIds")) AND rs."isRead" = TRUE
        INNER JOIN "Posts" p ON (p._id = rs."postId") AND (${getViewablePostsSelector("p")})
      WHERE
        cols._id = ANY($1)
      GROUP BY composite_id
    `;
  
    const results = await this.getRawDb().any<{ composite_id: string, read_count: string }>(query, [collectionIds, userIds]);
    const resultsById = keyBy(results, 'composite_id');
  
    return params.map(param => {
      const compositeId = `${param.collectionId}-${param.userId}`;
      const result = resultsById[compositeId];
      return result ? parseInt(result.read_count, 10) : 0;
    });
  }
}

recordPerfMetrics(CollectionsRepo);

export default CollectionsRepo;
