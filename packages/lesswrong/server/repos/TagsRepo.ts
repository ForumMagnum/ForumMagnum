import AbstractRepo from "./AbstractRepo";
import Tags from "../../lib/collections/tags/collection";
import { CommentCountTag } from "../../components/users/DialogueMatchingPage";


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

  async getUsersMostFrequentlyCommentedTags(userId:string): Promise<CommentCountTag[]> {
    return this.getRawDb().any(`
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

}
