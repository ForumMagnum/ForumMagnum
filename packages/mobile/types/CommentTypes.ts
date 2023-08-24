import { z } from "zod";
import { tagSchema } from "./TagTypes";
import { userSchema } from "./UserTypes";

export const commentSchema = z.object({
  _id: z.string(),
  postId: z.string(),
  tagId: z.optional(z.string()),
  tag: z.optional(tagSchema),
  // TODO: schemaToGraphql can't cope with arrays of objects yet
  // relevantTags: z.optional(z.array(tagSchema)),
  tagCommentType: z.optional(z.string()),
  parentCommentId: z.optional(z.string()),
  topLevelCommentId: z.optional(z.string()),
  descendentCount: z.optional(z.number()),
  title: z.optional(z.string()),
  contents: z.object({
    html: z.string(),
  }),
  postedAt: z.string(),
  repliesBlockedUntil: z.string(),
  deleted: z.optional(z.boolean()),
  deletedPublic: z.optional(z.boolean()),
  hideAuthor: z.optional(z.boolean()),
  authorIsUnreviewed: z.optional(z.boolean()),
  user: userSchema,
  currentUserVote: z.optional(z.string()),
  currentUserExtendedVote: z.optional(z.any()),
  baseScore: z.number(),
  extendedScore: z.optional(z.any()),
  score: z.number(),
  voteCount: z.number(),
  emojiReactors: z.optional(z.array(z.string())),
  answer: z.optional(z.boolean()),
  parentAnswerId: z.optional(z.string()),
  retracted: z.optional(z.boolean()),
  shortform: z.optional(z.boolean()),
  shortformFrontpage: z.optional(z.boolean()),
  lastSubthreadActivity: z.optional(z.string()),
  moderatorHat: z.optional(z.boolean()),
  hideModeratorHat: z.optional(z.boolean()),
  directChildrenCount: z.optional(z.number()),
  votingSystem: z.optional(z.string()),
}).describe("comment");

export type Comment = z.infer<typeof commentSchema>;
