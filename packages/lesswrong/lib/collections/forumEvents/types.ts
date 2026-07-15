import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import SimpleSchema from 'simpl-schema';

export const EVENT_FORMATS = ["BASIC", "POLL", "STICKERS"] as const;
export const EVENT_FORMATS_SET = new TupleSet(EVENT_FORMATS)
export type ForumEventFormat = UnionOf<typeof EVENT_FORMATS_SET>

export type ForumEventStickerInput = {
  _id: string;
  x: number;
  y: number;
  theta: number;
  emoji: string | null;
}

export type ForumEventSticker = ForumEventStickerInput & {
  commentId?: string;
  userId: string;
}

/** Bump this version when the format of `publicData` changes, so we can interpret the results of past events */
export const FORUM_EVENT_STICKER_VERSION = "STICKERS_1.0";

export type ForumEventStickerData = {
  format: typeof FORUM_EVENT_STICKER_VERSION,
  data: ForumEventSticker[]
}

/** An answer option for a multiple-choice poll. */
export type McPollAnswer = { _id: string; text: string };

/** A single user's vote in a multiple-choice poll (one or more answer ids). */
export type McPollVote = { answerIds: string[] };

/**
 * Shape of `ForumEvents.publicData` for a multiple-choice poll (stored with
 * eventFormat "POLL"). The answer options, mode, and every user's vote live
 * here, so no schema/table change is needed.
 */
export type McPollPublicData = {
  answers: McPollAnswer[];
  multiSelect: boolean;
  votes: Record<string, McPollVote>;
}

// Should match ForumEventCommentMetadataSchema
export type ForumEventCommentMetadata = {
  eventFormat: ForumEventFormat
  sticker?: Partial<ForumEventStickerInput> | null
  poll?: {
    /** 0 to 1 */
    voteWhenPublished: number
    /** 0 to 1, in the case where the vote hasn't changed, latestVote will be null and voteWhenPublished will have the latest vote */
    latestVote?: number | null
    /** _id of the revision of the question when the comment was published */
    pollQuestionWhenPublished?: string | null
    /** The content that is prefilled into the comment box after voting */
    commentPrompt?: string | null
  } | null
  mcPoll?: {
    /** The answer ids the user had selected when the comment was published */
    answerIdsWhenPublished: string[]
    /** The user's latest selection, if it has changed since publishing */
    latestAnswerIds?: string[] | null
    /** _id of the revision of the question when the comment was published */
    pollQuestionWhenPublished?: string | null
    /** The content that is prefilled into the comment box after voting */
    commentPrompt?: string | null
  } | null
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
      _id: {
        type: String,
        optional: true,
      },
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
        nullable: true,
      }
    }),
    optional: true,
    nullable: true,
  },
  poll: {
    type: new SimpleSchema({
      voteWhenPublished: {
        type: Number,
      },
      latestVote: {
        type: Number,
        optional: true,
        nullable: true
      },
      pollQuestionWhenPublished: {
        type: String,
        optional: true,
        nullable: true
      },
      commentPrompt: {
        type: String,
        optional: true,
        nullable: true
      }
    }),
    optional: true,
    nullable: true
  },
  mcPoll: {
    type: new SimpleSchema({
      answerIdsWhenPublished: {
        type: Array,
      },
      'answerIdsWhenPublished.$': {
        type: String,
      },
      latestAnswerIds: {
        type: Array,
        optional: true,
        nullable: true,
      },
      'latestAnswerIds.$': {
        type: String,
      },
      pollQuestionWhenPublished: {
        type: String,
        optional: true,
        nullable: true
      },
      commentPrompt: {
        type: String,
        optional: true,
        nullable: true
      }
    }),
    optional: true,
    nullable: true
  }
});
