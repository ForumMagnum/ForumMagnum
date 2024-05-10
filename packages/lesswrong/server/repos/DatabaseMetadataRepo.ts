import AbstractRepo from "./AbstractRepo";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import type { TimeSeries } from "../../lib/collections/posts/karmaInflation";
import { randomId } from "../../lib/random";
import type { GivingSeasonHeart } from "../../components/review/ReviewVotingCanvas";
import type { BannerEmoji } from "../../components/ea-forum/EAEmojisHeader";

const BANNER_EMOJI_NAME = "banner-emojis-2024-05";

type RawBannerEmoji = {
  userId: string,
  t: string,
} & Pick<BannerEmoji, "emoji" | "link" | "description" | "x" | "y">;

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

  async getBannerEmojis(currentUserId?: string): Promise<BannerEmoji[]> {
    const result = await this.getRawDb().oneOrNone(`
      -- DatabaseMetadataRepo.getBannerEmojis
      SELECT ARRAY_AGG(q."value" || JSONB_BUILD_OBJECT(
        'displayName', 'a',
        'id', q."key",
        'userId', '',
        'isCurrentUser', q."value"->>'userId' = $2
      )) "emojis"
      FROM (
        SELECT (JSONB_EACH("value")).*
        FROM "DatabaseMetadata"
        WHERE "name" = $1
      ) q
    `, [BANNER_EMOJI_NAME, currentUserId ?? ""]);
    return result?.emojis ?? [];
  }

  async getBannerEmojiRaw(id: string): Promise<Partial<RawBannerEmoji> | null> {
    const result = await this.getRawDb().oneOrNone(`
      -- DatabaseMetadataRepo.getBannerEmojiRaw
      SELECT "value"->$2 "emoji"
      FROM "DatabaseMetadata"
      WHERE "name" = $1
    `, [BANNER_EMOJI_NAME, id]);
    return result?.emoji ?? null;
  }

  async addBannerEmoji(
    userId: string,
    emoji: string,
    link: string,
    description: string,
    x: number,
    y: number,
    theta: number,
  ): Promise<BannerEmoji[]> {
    const t = new Date().toISOString();
    await this.none(`
      -- DatabaseMetadataRepo.addBannerEmoji
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value", "createdAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET "value" = "DatabaseMetadata"."value" || $3
    `, [
      randomId(),
      BANNER_EMOJI_NAME,
      {[randomId()]: {userId, emoji, link, description, x, y, theta, t}},
    ]);
    return this.getBannerEmojis();
  }

  async removeBannerEmoji(id: string): Promise<BannerEmoji[]> {
    await this.none(`
      -- DatabaseMetadataRepo.removeBannerEmoji
      UPDATE "DatabaseMetadata"
      SET "value" = "value" - $1
      WHERE "name" = $2
    `, [id, BANNER_EMOJI_NAME]);
    return this.getBannerEmojis();
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
}
