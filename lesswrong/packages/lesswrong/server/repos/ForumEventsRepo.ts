import ForumEvents from "@/lib/collections/forumEvents/collection";
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

  addVote(_id: string, userId: string, voteData: Json) {
    void this.none(`
      -- ForumEventsRepo.addVote
      UPDATE "ForumEvents"
      SET "publicData" = COALESCE("publicData", '{}'::jsonb) || $2
      WHERE "_id" = $1
    `, [_id, {[userId]: voteData}])
  }

  removeVote(_id: string, userId: string) {
    void this.none(`
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

  async addSticker({ forumEventId, stickerData }: { forumEventId: string; stickerData: ForumEventSticker; }) {
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

    const stickerExists = existingStickers.some((sticker) => sticker._id === stickerData._id);

    if (stickerExists) {
      throw new Error(`Sticker with _id ${stickerData._id} already exists.`);
    }

    return this.none(
      `
      -- ForumEventsRepo.addSticker
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
}

recordPerfMetrics(ForumEventsRepo);

export default ForumEventsRepo;
