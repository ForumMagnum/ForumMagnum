import { z } from "zod";

/**
 * The is the schema of the request sent from the InstantSearch frontend to
 * Algolia, and we implement this same interface in Elasticsearch.
 */
const querySchema = z.object({
  indexName: z.string(),
  params: z.object({
    query: z.optional(z.string()),
    highlightPreTag: z.optional(z.string()),
    highlightPostTag: z.optional(z.string()),
    hitsPerPage: z.optional(z.number().int().nonnegative()),
    page: z.optional(z.number().int().nonnegative()),
    facetFilters: z.optional(z.array(z.array(z.string()))),
    numericFilters: z.optional(z.array(z.string())),
    existsFilters: z.optional(z.array(z.string())),
    aroundLatLng: z.optional(z.string()),
  }),
});

export type SearchQuery = z.infer<typeof querySchema>;

export const isValidSearchQuery = (value: unknown): value is SearchQuery => {
  const result = querySchema.safeParse(value);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(
      "Invalid search query:",
      result.error.message,
      JSON.stringify(value, null, 2),
    );
  }
  return result.success;
}
