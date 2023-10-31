import AbstractRepo from "./AbstractRepo";
import Tags from "../../lib/collections/tags/collection";

export default class TagsRepo extends AbstractRepo<DbTag> {
  constructor() {
    super(Tags);
  }

  private getSearchDocumentQuery(): string {
    return `
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
        COALESCE(t."adminOnly", FALSE) AS "adminOnly",
        COALESCE(t."deleted", FALSE) AS "deleted",
        COALESCE(t."isSubforum", FALSE) AS "isSubforum",
        t."bannerImageId",
        t."parentTagId",
        t."description"->>'html' AS "description",
        NOW() AS "exportedAt"
      FROM "Tags" t
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaTag> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE t."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaTag[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      ORDER BY t."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Tags"`);
    return count;
  }

  async getUsersMostFrequentlyCommentedTags(userId:string): Promise<DbTag[]> {
    return this.any(`
      SELECT
        public."Tags".name,
        COUNT(public."Comments"._id) AS comment_count
      FROM public."Tags"
      INNER JOIN public."TagRels" ON public."Tags"._id = public."TagRels"."tagId"
      INNER JOIN
          public."Comments"
          ON public."TagRels"."postId" = public."Comments"."postId"
      WHERE
          public."Comments"."userId" = $1
          AND public."Tags".name NOT IN (
              'Community',
              'Rationality',
              'AI',
              'World Modeling',
              'World Optimization',
              'LessWrong Review',
              'Site Meta',
              'Practical',
              'Best of LessWrong',
              'Bounties (closed)',
              'Open Threads',
              'AI Risk',
              'Covid-19',
              'Bounties & Prizes (active)'
          )
      GROUP BY public."Tags".name
      ORDER BY comment_count DESC
    `, [userId]);
  }

  async getTopUsersTopCommentedTags(preTopCommentedTagTopUsers: any[]): Promise<any> {
    // Extract tag names and comment counts from the preprocessed data
    const tagNames = preTopCommentedTagTopUsers.map(item => item.name);
    const commentCounts = preTopCommentedTagTopUsers.map(item => item.post_comment_count);
  
    const query = `
      SELECT
        subquery.name AS "Tag name",
        df9.comment_count,
        json_object_agg(username, post_comment_count ORDER BY post_comment_count DESC) AS author_counts
      FROM unnest($1::text[]) AS subquery(name)
      INNER JOIN unnest($2::int[]) AS df9(comment_count) ON subquery.name = df9.name
      GROUP BY subquery.name, df9.comment_count
      ORDER BY df9.comment_count DESC
    `;
  
    try {
      return await this.any(query, [tagNames, commentCounts]);
    } catch (error) {
      console.error('Error executing topCommentedTagTopUsers query:', error);
      throw error;
    }
  }
}
