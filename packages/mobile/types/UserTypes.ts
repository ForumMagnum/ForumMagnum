import { z } from "zod";

export const userSchema = z.object({
  _id: z.string(),
  slug: z.string(),
  username: z.string(),
  displayName: z.string(),
  profileImageId: z.optional(z.string()),
  karma: z.optional(z.number()),
  deleted: z.optional(z.boolean()),
  htmlBio: z.optional(z.string()),
  jobTitle: z.optional(z.string()),
  organization: z.optional(z.string()),
  postCount: z.optional(z.number()),
  commentCount: z.optional(z.number()),
  sequenceCount: z.optional(z.number()),
}).describe("user");

export type User = z.infer<typeof userSchema>;
