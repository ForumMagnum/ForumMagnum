import { z } from "zod";

const postFields = {
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  postedAt: z.string(),
  curatedDate: z.string(),
  baseScore: z.number(),
  commentCount: z.optional(z.number()),
  question: z.optional(z.boolean()),
  url: z.optional(z.string()),
  user: z.object({
    username: z.string(),
    slug: z.string(),
  }),
} as const;

export const postSchema = z.object(postFields).describe("post");

export type Post = z.infer<typeof postSchema>;

export const postWithContentSchema = z.object({
  ...postFields,
  htmlBody: z.string(),
  readTimeMinutes: z.optional(z.number()),
}).describe("post");

export type PostWithContent = z.infer<typeof postWithContentSchema>;
