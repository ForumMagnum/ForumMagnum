import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import SimpleSchema from 'simpl-schema';

export const EVENT_FORMATS = ["BASIC", "POLL", "STICKERS"] as const;
export const EVENT_FORMATS_SET = new TupleSet(EVENT_FORMATS)
export type ForumEventFormat = UnionOf<typeof EVENT_FORMATS_SET>

export type ForumEventSticker = {
  x: number;
  y: number;
  theta: number;
  emoji: string;
  commentId: string;
}

export type ForumEventStickerData = Record<
  string,
  ForumEventSticker
>;

// TODO
export type NewForumEventStickerData = {
  format: "STICKERS_1.0",
  data: Record<string, ForumEventSticker[]>
}

// Should match ForumEventCommentMetadataSchema
export type ForumEventCommentMetadata = {
  eventFormat: ForumEventFormat
  sticker?: Partial<ForumEventSticker>
}

// Should match ForumEventCommentMetadata
// Note: If this becomes too hard to maintain I think it would be reasonable to switch to a json blob here (but keep the above type)
export const ForumEventCommentMetadataSchema = new SimpleSchema({
  eventFormat: {
    type: String,
    allowedValues: EVENT_FORMATS.slice(),
  },
  sticker: {
    type: new SimpleSchema({
      x: {
        type: Number,
        optional: true,
      },
      y: {
        type: Number,
        optional: true,
      },
      theta: {
        type: Number,
        optional: true,
      },
      emoji: {
        type: String,
        optional: true,
      },
      commentId: {
        type: String,
        optional: true,
      },
    }),
    optional: true,
  },
});

