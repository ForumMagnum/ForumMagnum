import { z } from "zod";

export const postSchema = z.object({
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
});

export type Post = z.infer<typeof postSchema>;
