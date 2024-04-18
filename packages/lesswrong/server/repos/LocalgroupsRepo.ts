import AbstractRepo from "./AbstractRepo";
import Localgroups from "../../lib/collections/localgroups/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";

class LocalgroupsRepo extends AbstractRepo<"Localgroups"> {
  constructor() {
    super(Localgroups);
  }

  moveUserLocalgroupsToNewUser(oldUserId: string, newUserId: string): Promise<null> {
    return this.none(`
      -- LocalgroupsRepo.moveUserLocalgroupsToNewUser
      UPDATE "Localgroups"
      SET "organizerIds" = ARRAY_APPEND(ARRAY_REMOVE("organizerIds", $1), $2)
      WHERE ARRAY_POSITION("organizerIds", $1) IS NOT NULL
    `, [oldUserId, newUserId]);
  }

 private getSearchDocumentQuery(): string {
    return `
      SELECT
        l."_id",
        l."_id" AS "objectID",
        l."name",
        l."nameInAnotherLanguage",
        l."organizerIds",
        l."lastActivity",
        l."types",
        l."categories",
        COALESCE(l."isOnline", FALSE) AS "isOnline",
        CASE WHEN l."googleLocation"->'geometry'->'location' IS NULL THEN NULL ELSE
          JSONB_BUILD_OBJECT(
            'type', 'point',
            'coordinates', JSONB_BUILD_ARRAY(
              l."googleLocation"->'geometry'->'location'->'lng',
              l."googleLocation"->'geometry'->'location'->'lat'
          )) END AS "_geoloc",
        l."location",
        l."contactInfo",
        l."facebookLink",
        l."facebookPageLink",
        l."meetupLink",
        l."slackLink",
        l."website",
        l."bannerImageId",
        COALESCE(l."inactive", FALSE) AS "inactive",
        COALESCE(l."deleted", FALSE) AS "deleted",
        l."createdAt",
        EXTRACT(EPOCH FROM l."createdAt") * 1000 AS "publicDateMs",
        l."contents"->>'html' AS "description",
        NOW() AS "exportedAt"
      FROM "Localgroups" l
    `;
  }

  getSearchDocumentById(id: string): Promise<SearchLocalgroup> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE l."_id" = $1 AND l."name" IS NOT NULL
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchLocalgroup[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      WHERE l."name" IS NOT NULL
      ORDER BY l."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`
      SELECT COUNT(*)
      FROM "Localgroups"
      WHERE l."name" IS NOT NULL
    `);
    return count;
  }
}

recordPerfMetrics(LocalgroupsRepo);

export default LocalgroupsRepo;
