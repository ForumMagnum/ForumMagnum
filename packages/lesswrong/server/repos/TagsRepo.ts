import AbstractRepo from "./AbstractRepo";
import Tags from "../../lib/collections/tags/collection";
import { UserTopTag } from "../../components/users/DialogueMatchingPage";
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

  async getUserTopTags(userId: string, limit = 15): Promise<UserTopTag[]> {
    return this.getRawDb().any(`
      SELECT
        public."Tags".name,
        public."TagRels"."tagId",
        COUNT(*) AS count
      FROM public."TagRels"
      INNER JOIN public."Tags" ON public."TagRels"."tagId" = public."Tags"._id
      WHERE
        public."TagRels"."postId" IN (
          SELECT public."Comments"."postId"
          FROM public."Comments"
          WHERE public."Comments"."userId" = $1
          AND public."Comments"."postedAt" > NOW() - INTERVAL '2 years'
        )
        AND public."Tags".name NOT IN (
          'Community', 'Rationality', 'World Modeling', 'Site Meta', 'Covid-19', 'Practical', 
          'World Optimization', 'Best of LessWrong', 'LessWrong Review', 'LessWrong Event Transcripts', 
          'Existential Risk', 'AI Risk', 'Epistemic Review', 'Open Threads', 'AI', 'Politics', 'Epistemology',
          'Drama', 'Meta', 'Has Diagram', 'News', 'LW Moderation'
        )
      GROUP BY public."TagRels"."tagId", public."Tags".name
      ORDER BY count DESC
      LIMIT $2
    `, [userId, limit]);
  }
}
