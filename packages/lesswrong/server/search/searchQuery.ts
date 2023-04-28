import { z } from "zod";

const querySchema = z.object({
  indexName: z.string(),
  params: z.object({
    query: z.string(),
    highlightPreTag: z.optional(z.string()),
    highlightPostTag: z.optional(z.string()),
    hitsPerPage: z.optional(z.number().int().nonnegative()),
    page: z.optional(z.number().int().nonnegative()),
  }),
});

export type SearchQuery = z.infer<typeof querySchema>;

export const isValidSearchQuery = (value: unknown): value is SearchQuery => {
  try {
    querySchema.parse(value);
    return true;
  } catch {
    return false;
  }
}
