import { z } from "zod";

const querySchema = z.object({
  indexName: z.string(),
  params: z.object({
    query: z.string(),
    highlightPreTag: z.optional(z.string()),
    highlightPostTag: z.optional(z.string()),
    hitsPerPage: z.optional(z.number().int().nonnegative()),
    page: z.optional(z.number().int().nonnegative()),
    facetFilters: z.optional(z.array(z.array(z.string()))),
  }),
});

export type SearchQuery = z.infer<typeof querySchema>;

export const isValidSearchQuery = (value: unknown): value is SearchQuery => {
  try {
    querySchema.parse(value);
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Invalid search query:", e.message, JSON.stringify(value, null, 2));
    return false;
  }
}
