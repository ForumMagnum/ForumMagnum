import Books from "@/server/collections/books/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class BooksRepo extends AbstractRepo<"Books"> {
  constructor() {
    super(Books);
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

