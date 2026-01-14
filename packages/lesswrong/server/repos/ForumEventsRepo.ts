import ForumEvents from "@/server/collections/forumEvents/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { FORUM_EVENT_STICKER_VERSION, ForumEventSticker } from "@/lib/collections/forumEvents/types";

class ForumEventsRepo extends AbstractRepo<"ForumEvents"> {
  constructor() {
    super(ForumEvents);
  }

  async getUserVote(_id: string, userId: string) {
    const res = await this.getRawDb().oneOrNone(`
      -- ForumEventsRepo.getUserVote
      SELECT "publicData"->$2 as vote
      FROM "ForumEvents"
      WHERE "_id" = $1
    `, [_id, userId])
    return res ? res.vote : null
  }

  async addVote(_id: string, userId: string, voteData: Json) {
    return this.none(`
      -- ForumEventsRepo.addVote
      UPDATE "ForumEvents"
      SET "publicData" = COALESCE("publicData", '{}'::jsonb) || $2
      WHERE "_id" = $1
    `, [_id, {[userId]: voteData}])
  }

  async removeVote(_id: string, userId: string) {
    return this.none(`
      -- ForumEventsRepo.removeVote
      UPDATE "ForumEvents"
      SET "publicData" = "publicData" - $1
      WHERE "_id" = $2
    `, [userId, _id])
  }

  /**
   * Asserts "publicData" is tagged with the format expected. If no format is set (if the data is uninitialised),
   * sets it to the expexcted format.
   */
  async ensureFormatMatches({ forumEventId, format }: { forumEventId: string; format: string; }) {
    const result = await this.getRawDb().oneOrNone<{ currentFormat: string | null }>(`
      -- ForumEventsRepo.ensureFormatMatches
      UPDATE "ForumEvents"
      SET "publicData" = jsonb_set(
        COALESCE("publicData", '{}'::jsonb),
        '{format}',
        to_jsonb($2::text)
      )
      WHERE "_id" = $1
      AND (
        "publicData"->>'format' IS NULL
        OR "publicData"->>'format' = $2
      )
      RETURNING "publicData"->>'format' AS "currentFormat"
    `, [forumEventId, format]);

    if (result?.currentFormat !== format) {
      throw new Error(`Format mismatch: expected ${format}, found ${result?.currentFormat}`);
    }
  }

  /**
   * Upsert a sticker. If it exists (by _id), merge the new data, otherwise create it.
   */
  async upsertSticker({ forumEventId, stickerData, maxStickersPerUser }: {
    forumEventId: string;
    stickerData: Partial<ForumEventSticker> & { _id: string; userId: string };
    maxStickersPerUser?: number | null;
  }) {
    await this.ensureFormatMatches({forumEventId, format: FORUM_EVENT_STICKER_VERSION});

    // Check if the sticker already exists
    const existingStickers = (await this.getRawDb().oneOrNone<{ stickers: ForumEventSticker[] | null }>(
      `
      SELECT "publicData"->'data' AS stickers
      FROM "ForumEvents"
      WHERE "_id" = $1
      `,
      [forumEventId]
    ))?.stickers ?? [];

    const existingSticker = existingStickers.find((sticker) => sticker._id === stickerData._id);

    if (existingSticker) {
      // Verify the sticker belongs to this user
      if (existingSticker.userId !== stickerData.userId) {
        throw new Error("Cannot update another user's sticker");
      }

      // Update existing sticker by merging new data
      return this.none(
        `
        -- ForumEventsRepo.upsertSticker (update)
        UPDATE "ForumEvents"
        SET "publicData" = jsonb_set(
          "publicData",
          '{data}',
          (SELECT jsonb_agg(
            CASE 
              WHEN elem->>'_id' = $1
              THEN elem || $2::jsonb
              ELSE elem
            END
          )
          FROM jsonb_array_elements("publicData"->'data') elem)
        )
        WHERE "_id" = $3
        `,
        [stickerData._id, JSON.stringify(stickerData), forumEventId]
      );
    } else {
      if (maxStickersPerUser !== undefined && maxStickersPerUser !== null) {
        const userStickerCount = existingStickers.filter(s => s.userId === stickerData.userId).length;
        if (userStickerCount >= maxStickersPerUser) {
          throw new Error("You have reached the maximum number of stickers for this event");
        }
      }

      // Add new sticker
      return this.none(
        `
        -- ForumEventsRepo.upsertSticker (insert)
        UPDATE "ForumEvents"
        SET "publicData" = fm_add_to_set(
          "publicData",
          ARRAY['data'],
          $1::jsonb
        )
        WHERE "_id" = $2
        `,
        [JSON.stringify(stickerData), forumEventId]
      );
    }
  }

  async removeSticker({ forumEventId, stickerId, userId }: { forumEventId: string; stickerId: string; userId: string }) {
    await this.ensureFormatMatches({forumEventId, format: FORUM_EVENT_STICKER_VERSION});

    return this.none(
      `
      -- ForumEventsRepo.removeSticker
      UPDATE "ForumEvents"
      SET "publicData" = jsonb_set(
        "publicData",
        '{data}',
        (SELECT jsonb_agg(elem) 
         FROM jsonb_array_elements("publicData"->'data') elem 
         WHERE NOT (elem->>'userId' = $2 AND elem->>'_id' = $1))
      )
      WHERE "_id" = $3
      `,
      [stickerId, userId, forumEventId]
    );
  }

  /**
   * Get polls (eventFormat = 'POLL') closing between minDate and maxDate.
   */
  async getPollsClosingBetween(minDate: Date, maxDate: Date): Promise<Array<{
    _id: string;
    derivedPostId: string | null;
    commentId: string | null;
    startDate: Date | null;
    endDate: Date;
    publicData: Record<string, unknown> | null;
    creatorUserIds: string[];
  }>> {
    return this.getRawDb().any<{
      _id: string;
      derivedPostId: string | null;
      commentId: string | null;
      startDate: Date | null;
      endDate: Date;
      publicData: Record<string, unknown> | null;
      creatorUserIds: string[];
    }>(`
      -- ForumEventsRepo.getPollsClosingBetween
      SELECT
        fe."_id",
        COALESCE(fe."postId", c."postId") as "derivedPostId",
        fe."commentId",
        fe."startDate",
        fe."endDate",
        fe."publicData",
        array_remove(CASE
          WHEN fe."commentId" IS NOT NULL THEN ARRAY[c."userId"]
          ELSE ARRAY[p."userId"] || COALESCE(p."coauthorUserIds", ARRAY[]::text[])
        END, NULL) as "creatorUserIds"
      FROM "ForumEvents" fe
      LEFT JOIN "Comments" c ON fe."commentId" = c."_id"
      LEFT JOIN "Posts" p ON COALESCE(fe."postId", c."postId") = p."_id"
      WHERE fe."eventFormat" = 'POLL'
        AND fe."endDate" IS NOT NULL
        AND fe."endDate" >= $1
        AND fe."endDate" < $2
    `, [minDate, maxDate]);
  }

  /**
   * Get polls (eventFormat = 'POLL') that closed between minDate and maxDate.
   */
  async getPollsClosedBetween(minDate: Date, maxDate: Date): Promise<Array<{
    _id: string;
    derivedPostId: string | null;
    commentId: string | null;
    publicData: Record<string, unknown> | null;
    creatorUserIds: string[];
  }>> {
    return this.getRawDb().any<{
      _id: string;
      derivedPostId: string | null;
      commentId: string | null;
      publicData: Record<string, unknown> | null;
      creatorUserIds: string[];
    }>(`
      -- ForumEventsRepo.getPollsClosedBetween
      SELECT
        fe."_id",
        COALESCE(fe."postId", c."postId") as "derivedPostId",
        fe."commentId",
        fe."publicData",
        array_remove(CASE
          WHEN fe."commentId" IS NOT NULL THEN ARRAY[c."userId"]
          ELSE ARRAY[p."userId"] || COALESCE(p."coauthorUserIds", ARRAY[]::text[])
        END, NULL) as "creatorUserIds"
      FROM "ForumEvents" fe
      LEFT JOIN "Comments" c ON fe."commentId" = c."_id"
      LEFT JOIN "Posts" p ON COALESCE(fe."postId", c."postId") = p."_id"
      WHERE fe."eventFormat" = 'POLL'
        AND fe."endDate" IS NOT NULL
        AND fe."endDate" >= $1
        AND fe."endDate" < $2
    `, [minDate, maxDate]);
  }
}

recordPerfMetrics(ForumEventsRepo);

export default ForumEventsRepo;
