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

export type PostgresSearchQuery = z.infer<typeof querySchema>;

export const isPostgresSearchQuery = (value: unknown): value is PostgresSearchQuery => {
  try {
    querySchema.parse(value);
    return true;
  } catch {
    return false;
  }
}
