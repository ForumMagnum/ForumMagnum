import AbstractRepo from "./AbstractRepo";
import { DatabaseMetadata } from "../../server/collections/databaseMetadata/collection";
import type { TimeSeries } from "../../lib/collections/posts/karmaInflation";
import { randomId } from "../../lib/random";
import type { GivingSeasonHeart } from "../../components/review/ReviewVotingCanvas";
import keyBy from "lodash/keyBy";

export default class DatabaseMetadataRepo extends AbstractRepo<"DatabaseMetadata"> {
  constructor() {
    super(DatabaseMetadata);
  }

  private getByName(name: string): Promise<DbDatabaseMetadata | null> {
    // We use getRawDb here as this may be executed during server startup
    // before the collection is properly initialized
    return this.getRawDb().oneOrNone(`
      -- DatabaseMetadataRepo.getByName
      SELECT * from "DatabaseMetadata" WHERE "name" = $1
    `,
      [name],
      `DatabaseMetadata.${name}`,
    );
  }
  
  async getByNames(names: string[]): Promise<Array<DbDatabaseMetadata|null>> {
    const results = (await this.any(`
      -- DatabaseMetadataRepo.getByName
      SELECT * from "DatabaseMetadata" WHERE "name" IN ($1:csv)
    `, [names])) as DbDatabaseMetadata[];
    
    const resultsByName = keyBy(results, r=>r.name);
    return names.map(n => resultsByName[n] ?? null);
  }

  private electionNameToMetadataName(electionName: string): string {
    return `${electionName}Hearts`;
  }

  async getGivingSeasonHearts(electionName: string): Promise<GivingSeasonHeart[]> {
    const metadataName = this.electionNameToMetadataName(electionName);
    const result = await this.getRawDb().oneOrNone(`
      -- DatabaseMetadataRepo.getGivingSeasonHearts
      SELECT ARRAY_AGG(q."value" || JSONB_BUILD_OBJECT(
        'userId', u."_id",
        'displayName', u."displayName"
      )) "hearts"
      FROM (
        SELECT (JSONB_EACH("value")).*
        FROM "DatabaseMetadata"
        WHERE "name" = $1
      ) q
      JOIN "Users" u ON q."key" = u."_id"
    `, [metadataName]);
    return result?.hearts ?? [];
  }

  async addGivingSeasonHeart(
    electionName: string,
    userId: string,
    x: number,
    y: number,
    theta: number,
  ): Promise<GivingSeasonHeart[]> {
    const metadataName = this.electionNameToMetadataName(electionName);
    await this.none(`
      -- DatabaseMetadataRepo.addGivingSeasonHeart
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value", "createdAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET "value" = "DatabaseMetadata"."value" || $3
    `, [
      randomId(),
      metadataName,
      {[userId]: {x, y, theta}},
    ]);
    return this.getGivingSeasonHearts(electionName);
  }

  async removeGivingSeasonHeart(
    electionName: string,
    userId: string,
  ): Promise<GivingSeasonHeart[]> {
    const metadataName = this.electionNameToMetadataName(electionName);
    await this.none(`
      -- DatabaseMetadataRepo.removeGivingSeasonHeart
      UPDATE "DatabaseMetadata"
      SET "value" = "value" - $1
      WHERE "name" = $2
    `, [userId, metadataName]);
    return this.getGivingSeasonHearts(electionName);
  }

  getServerSettings(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("serverSettings");
  }

  getPublicSettings(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("publicSettings");
  }

  getDatabaseId(): Promise<DbDatabaseMetadata | null> {
    return this.getByName("databaseId");
  }

  upsertKarmaInflationSeries(karmaInflationSeries: TimeSeries): Promise<null> {
    return this.none(`
      INSERT INTO "DatabaseMetadata" (
        "_id",
        "name",
        "value",
        "schemaVersion",
        "createdAt"
      ) VALUES (
        $(_id), $(name), $(value), $(schemaVersion), $(createdAt)
      ) ON CONFLICT (
        "name"
      )
      DO UPDATE SET
        "value" = $(value)
      `, {
      _id: randomId(),
      name: "karmaInflationSeries",
      value: {...karmaInflationSeries},
      schemaVersion: 1,
      createdAt: new Date(),
    });
  }

  async getGivingSeason2025DonationTotal(): Promise<number> {
    const result = await this.getRawDb().oneOrNone(`
      -- DatabaseMetadataRepo.getGivingSeason2025DonationTotal
      SELECT COALESCE(("value"->'total')::FLOAT, 0) AS "total"
      FROM "DatabaseMetadata"
      WHERE "name" = 'givingSeason2025ElectionTotal'
    `);
    return result?.total ?? 0;
  }

  async addGivingSeason2025Donation(usdAmount: number): Promise<void> {
    await this.none(`
      -- DatabaseMetadataRepo.addGivingSeason2025Donation
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value", "createdAt")
      VALUES ($1, 'givingSeason2025ElectionTotal', $2, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET
        "value" = JSONB_BUILD_OBJECT(
          'total',
          (("DatabaseMetadata"."value")->'total')::FLOAT + $3
        )
    `, [
      randomId(),
      {total: usdAmount},
      usdAmount,
    ]);
  }

  async setGivingSeason2025DonationTotal(usdAmount: number): Promise<void> {
    await this.none(`
      -- DatabaseMetadataRepo.setGivingSeason2025DonationTotal
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value", "createdAt")
      VALUES ($1, 'givingSeason2025ElectionTotal', $2, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET "value" = $2
    `, [
      randomId(),
      {total: usdAmount},
    ]);
  }
}
