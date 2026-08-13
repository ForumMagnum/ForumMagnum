import Books from "@/server/collections/books/collection";
import AbstractRepo from "./AbstractRepo";
import keyBy from "lodash/keyBy";
import { getViewablePostsSelector } from "./helpers";
import { recordPerfMetrics } from "./perfMetricWrapper";

class BooksRepo extends AbstractRepo<"Books"> {
  constructor() {
    super(Books);
  }

  /**
   * The total number of posts for the books with the given ids (direct postIds
   * plus posts of the book's sequences), returned in the same order as the ids.
   */
  async postsCount(bookIds: string[]): Promise<number[]> {
    const query = `
      -- BooksRepo.postsCount
      SELECT
        b._id as _id,
        count(DISTINCT p._id) as total_count
      FROM
        "Books" b
        LEFT JOIN "Sequences" s ON s._id = ANY(b."sequenceIds")
        LEFT JOIN "Chapters" c ON s._id = c."sequenceId"
        INNER JOIN "Posts" p ON (p._id = ANY(c."postIds") OR p._id = ANY(b."postIds")) AND (${getViewablePostsSelector("p")})
      WHERE
        b._id = ANY($1)
      GROUP BY b._id
    `;

    const results = await this.getRawDb().any<{_id: string, total_count: string}>(query, [bookIds]);
    const resultsById = keyBy(results, '_id');
    return bookIds.map(id => {
      const result = resultsById[id];
      return result ? parseInt(result.total_count, 10) : 0;
    });
  }

  /**
   * The number of read posts for the given (bookId, userId) combinations, returned in the order given.
   */
  async readPostsCount(params: { bookId: string; userId: string }[]): Promise<number[]> {
    const bookIds = params.map(p => p.bookId);
    const userIds = params.map(p => p.userId);

    const query = `
      -- BooksRepo.readPostsCount
      SELECT
        b._id || '-' || rs."userId" as composite_id,
        count(DISTINCT p._id) as read_count
      FROM
        "Books" b
        LEFT JOIN "Sequences" s ON s._id = ANY(b."sequenceIds")
        LEFT JOIN "Chapters" c ON s._id = c."sequenceId"
        INNER JOIN "ReadStatuses" rs ON rs."userId" = ANY($2) AND (rs."postId" = ANY(c."postIds") OR rs."postId" = ANY(b."postIds")) AND rs."isRead" = TRUE
        INNER JOIN "Posts" p ON (p._id = rs."postId") AND (${getViewablePostsSelector("p")})
      WHERE
        b._id = ANY($1)
      GROUP BY composite_id
    `;

    const results = await this.getRawDb().any<{ composite_id: string, read_count: string }>(query, [bookIds, userIds]);
    const resultsById = keyBy(results, 'composite_id');

    return params.map(param => {
      const compositeId = `${param.bookId}-${param.userId}`;
      const result = resultsById[compositeId];
      return result ? parseInt(result.read_count, 10) : 0;
    });
  }

  async getBookWordCount(bookId: string): Promise<number> {
    const result = await this.getRawDb().oneOrNone<{ totalWordCount: number }>(`
      -- BooksRepo.getBookWordCount
      SELECT COALESCE(SUM(r."wordCount"), 0) as "totalWordCount"
      FROM "Books" b
      CROSS JOIN UNNEST(b."sequenceIds") AS seq_id
      JOIN "Sequences" s ON s."_id" = seq_id
      JOIN "Chapters" c ON c."sequenceId" = s."_id"
      CROSS JOIN UNNEST(c."postIds") AS post_id
      JOIN "Posts" p ON p."_id" = post_id
      JOIN "Revisions" r ON r."_id" = p."contents_latest"
      WHERE b."_id" = $1
    `, [bookId]);
    return result?.totalWordCount ?? 0;
  }
}

recordPerfMetrics(BooksRepo);

export default BooksRepo;

