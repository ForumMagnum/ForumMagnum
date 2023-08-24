import { z } from "zod";

export const tagSchema = z.object({
  _id: z.string(),
  name: z.string(),
  shortName: z.optional(z.string()),
  slug: z.string(),
  core: z.optional(z.boolean()),
  postCount: z.number(),
  adminOnly: z.optional(z.boolean()),
}).describe("tag");

export type Tag = z.infer<typeof tagSchema>;
