import AbstractRepo from "./AbstractRepo";
import Tags from "../../lib/collections/tags/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { TagWithCommentCount } from "../../components/dialogues/DialogueRecommendationRow";
import { getViewableTagsSelector } from "./helpers";

class TagsRepo extends AbstractRepo<"Tags"> {
  constructor() {
    super(Tags);
  }

  async tagRouteWillDefinitelyReturn200(slug: string): Promise<boolean> {
    const res = await this.getRawDb().oneOrNone<{exists: boolean}>(`
      -- SequencesRepo.sequenceRouteWillDefinitelyReturn200
      SELECT EXISTS(
        SELECT 1
        FROM "Tags"
        WHERE "slug" = $1 AND ${getViewableTagsSelector()}
      )
    `, [slug]);

    return res?.exists ?? false;
  }


  private getSearchDocumentQuery(): string {
    return `
      -- TagsRepo.getSearchDocumentQuery
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

  getSearchDocumentById(id: string): Promise<SearchTag> {
    return this.getRawDb().one(`
      -- TagsRepo.getSearchDocumentById
      ${this.getSearchDocumentQuery()}
      WHERE t."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchTag[]> {
    return this.getRawDb().any(`
      -- TagsRepo.getSearchDocuments
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

  async getUserTopTags(userId: string, limit = 15): Promise<TagWithCommentCount[]> {
    const tags = await this.getRawDb().any(`
      -- TagsRepo.getUserTopTags
      SELECT
        t.*,
        COUNT(*) AS "commentCount"
      FROM "TagRels" tr
      INNER JOIN "Tags" t ON tr."tagId" = t._id
      WHERE
        tr."postId" IN (
          SELECT c."postId"
          FROM "Comments" c
          WHERE c."userId" = $1
          AND c."postedAt" > NOW() - INTERVAL '3 years'
        )
      AND t.name NOT IN (
        'Community', 'Rationality', 'World Modeling', 'Site Meta', 'Covid-19', 'Practical', 
        'World Optimization', 'Best of LessWrong', 'LessWrong Review', 'LessWrong Event Transcripts', 
        'Existential Risk', 'AI Risk', 'Epistemic Review', 'Open Threads', 'AI', 'Politics', 'Epistemology',
        'Drama', 'Meta', 'Has Diagram', 'News', 'LW Moderation', 'Experiments', 'Dialogue (format)', 'LW Team Announcements', 
        'Bounties & Prizes (active)', 'Training', 'Distinctions', 'Social & Cultural Dynamics', 'Technological Forecasting'
      )
      GROUP BY t._id
      ORDER BY "commentCount" DESC
      LIMIT $2
    `, [userId, limit]);
    return tags.map(tag => {
      const {commentCount, ...rest} = tag;
      return ({
        tag: rest,
        commentCount
      })
    })
  }

}

recordPerfMetrics(TagsRepo);

export default TagsRepo;
